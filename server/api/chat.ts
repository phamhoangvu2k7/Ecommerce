import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { convertToModelMessages, createUIMessageStreamResponse, isStepCount, streamText, toUIMessageStream } from 'ai'
import { createError, defineEventHandler, readBody } from 'h3'
import { aiTools } from '~/server/utils/aiTools'

interface StreamPartWithError {
  type: string
  error?: unknown
}

function isErrorStreamPart(value: unknown): value is StreamPartWithError {
  return typeof value === 'object' && value !== null && 'type' in value && (value as StreamPartWithError).type === 'error'
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error)
    return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as Record<string, unknown>).message)
  }
  return String(err || '')
}

function getErrorStatusCode(err: unknown): number | null {
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>
    if (typeof obj.status === 'number')
      return obj.status
    if (typeof obj.statusCode === 'number')
      return obj.statusCode
  }
  return null
}

// Helper: Giới hạn thời gian chờ (12s) để cho phép các Model lớn (Gemini 1.5 Pro / 70B+) suy luận kỹ và gọi Tool chính xác nhất
async function fetchFirstValidChunkWithTimeout(iterator: AsyncIterator<any>, timeoutMs = 12000) {
  const bufferedChunks: any[] = []
  let timer: ReturnType<typeof setTimeout>

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout (${timeoutMs}ms) khi chờ token từ AI!`)), timeoutMs)
  })

  try {
    while (true) {
      const nextPromise = iterator.next()
      const { done, value } = await Promise.race([nextPromise, timeoutPromise])

      if (done)
        break

      bufferedChunks.push(value)

      if (isErrorStreamPart(value)) {
        clearTimeout(timer!)
        const errObj = (value as any).error || (value as any).errorText || 'Model trả về lỗi stream'
        throw typeof errObj === 'string' ? new Error(errObj) : errObj
      }

      // Nếu gặp chunk dữ liệu thực sự (không phải event start/start-step)
      const chunkType = value?.type
      if (chunkType && chunkType !== 'start' && chunkType !== 'start-step') {
        clearTimeout(timer!)
        return { bufferedChunks, lastDone: done }
      }
    }
    clearTimeout(timer!)
    return { bufferedChunks, lastDone: true }
  }
  catch (err) {
    clearTimeout(timer!)
    throw err
  }
}

function normalizeMessages(rawMessages: any[]) {
  return rawMessages.map((msg) => {
    if (msg && typeof msg === 'object' && !msg.parts) {
      const text = typeof msg.content === 'string' ? msg.content : (msg.text || '')
      return {
        ...msg,
        parts: [{ type: 'text', text }],
      }
    }
    return msg
  })
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { messages } = body || {}

  if (!messages || !Array.isArray(messages)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Danh sách tin nhắn (messages) không hợp lệ!',
    })
  }

  // Lấy API Keys an toàn cho cả Local và Cloudflare Pages
  const config = useRuntimeConfig(event)
  const eventContext = event.context as { cloudflare?: { env?: Record<string, string | undefined> } }
  const cfEnv = eventContext?.cloudflare?.env || {}

  const geminiApiKey = config.geminiApiKey || cfEnv.GEMINI_API_KEY || process.env.GEMINI_API_KEY
  const openrouterApiKey = config.openrouterApiKey || cfEnv.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY

  if (!geminiApiKey && !openrouterApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Chưa cấu hình GEMINI_API_KEY hoặc OPENROUTER_API_KEY!',
    })
  }

  // Khởi tạo các provider
  const google = geminiApiKey ? createGoogleGenerativeAI({ apiKey: geminiApiKey }) : null
  const openrouter = openrouterApiKey ? createOpenRouter({ apiKey: openrouterApiKey }) : null

  // System Prompt định hướng cho AI làm Trợ lý bán hàng thông minh
  const systemPrompt = `
Bạn là Trợ Lý AI Tư Vấn Bán Hàng thông minh và thân thiện của cửa hàng e-commerce.
Nhiệm vụ của bạn:
1. Trả lời người dùng bằng Tiếng Việt lịch sự, tự nhiên, trình bày trực quan và chuyên nghiệp.
2. Mỗi khi người dùng hỏi về sản phẩm, danh mục, giá bán, khoảng giá (ví dụ: dưới 1 triệu, từ 200k đến 500k) hoặc tồn kho, BẮT BUỘC bạn phải sử dụng Tool tương ứng (searchProducts, getCategories, getProductDetails) để truy vấn Database.
3. KHÔNG ĐƯỢC tự nghĩ ra giá tiền hay thông tin sản phẩm nếu Tool không trả về.
4. Khi trình bày giá tiền, hãy định dạng đẹp mắt (Ví dụ: **250.000 VNĐ**).
5. QUY TẮC TRÌNH BÀY GIAO DIỆN CHAT:
   - Khi trình bày danh mục hoặc danh sách sản phẩm, BẮT BUỘC dùng danh sách gạch đầu dòng (bullet points) kèm emoji sinh động (Ví dụ: 📱 **Điện thoại**, 💻 **Laptop**).
   - TUYỆT ĐỐI KHÔNG dùng dạng bảng Markdown thô (| Header | Column |) vì khung chat nhỏ sẽ bị vỡ dòng.
   - Giữ các đoạn văn ngắn gọn, dễ đọc, có khoảng cách thoáng mắt.
6. Nếu tìm thấy sản phẩm, hãy khuyến khích khách hàng bấm xem chi tiết hoặc liên hệ cửa hàng.
`

  try {
    const modelMessages = await convertToModelMessages(normalizeMessages(messages))
    let activeStream: ReadableStream | null = null
    let primaryError: unknown = null

    // Danh sách các Candidate Models ưu tiên hàng đầu về độ CHÍNH XÁC & khả năng gọi Tool chuẩn xác
    const candidates: Array<{ provider: 'openrouter' | 'google', modelId: string }> = []

    // 1. ƯU TIÊN HÀNG ĐẦU: Google Gemini (Khả năng suy luận & gọi Tool CSDL chuẩn xác 100%)
    if (google) {
      candidates.push(
        { provider: 'google', modelId: 'gemini-1.5-pro' },
        { provider: 'google', modelId: 'gemini-1.5-flash' },
        { provider: 'google', modelId: 'gemini-2.0-flash' },
      )
    }

    // 2. DỰ PHÒNG: Các Model thông minh nhất từ OpenRouter
    if (openrouter) {
      candidates.push(
        { provider: 'openrouter', modelId: 'nvidia/nemotron-3.5-lightning:free' },
        { provider: 'openrouter', modelId: 'google/gemma-4-26b-a4b-it:free' },
        { provider: 'openrouter', modelId: 'minimax/minimax-m3:free' },
        { provider: 'openrouter', modelId: 'liquid/lfm-2.5-2.6b:free' },
      )
    }

    // Vòng lặp Failover thông minh với Timeout Guard 5.5 giây cho mỗi model
    for (const item of candidates) {
      try {
        const modelInstance = item.provider === 'openrouter'
          ? openrouter!(item.modelId)
          : google!(item.modelId)

        const result = streamText({
          model: modelInstance,
          system: systemPrompt,
          messages: modelMessages,
          tools: aiTools,
          stopWhen: isStepCount(5),
          maxRetries: 0,
        })

        const iterator = result.fullStream[Symbol.asyncIterator]()
        // Chờ dữ liệu thực sự (đã qua kiểm tra lỗi) với Timeout 12s cho phép suy luận chính xác
        const { bufferedChunks, lastDone } = await fetchFirstValidChunkWithTimeout(iterator, 12000)

        activeStream = new ReadableStream({
          async start(controller) {
            // Đẩy toàn bộ chunk đã được buffer trước đó
            for (const chunk of bufferedChunks) {
              controller.enqueue(chunk)
            }
            if (lastDone) {
              controller.close()
              return
            }
            while (true) {
              try {
                const { done, value } = await iterator.next()
                if (done) {
                  controller.close()
                  break
                }
                if (isErrorStreamPart(value)) {
                  console.error('⚠️ [Stream Mid-flight Error Chunk]:', value)
                  controller.enqueue({
                    type: 'text-delta',
                    id: 'error-chunk',
                    delta: '\n\n⚠️ *(Kết nối với AI bị gián đoạn. Vui lòng gửi lại câu hỏi!)*',
                  })
                  controller.close()
                  break
                }
                controller.enqueue(value)
              }
              catch (streamErr: unknown) {
                console.error('⚠️ [AI Stream Mid-flight Exception]:', getErrorMessage(streamErr))
                controller.enqueue({
                  type: 'text-delta',
                  id: 'error-chunk',
                  delta: '\n\n⚠️ *(Kết nối với AI bị gián đoạn. Vui lòng gửi lại câu hỏi!)*',
                })
                controller.close()
                break
              }
            }
          },
        })

        break
      }
      catch (err: unknown) {
        console.warn(`⚠️ [AI Failover Guard] ${item.provider}:${item.modelId} không phản hồi / lỗi:`, getErrorMessage(err))
        primaryError = err

        const errMsg = getErrorMessage(err).toLowerCase()
        const errCode = getErrorStatusCode(err)
        if (errCode === 429 || errMsg.includes('quota') || errMsg.includes('rate limit')) {
          console.warn(`⚡ [AI Failover Guard] ${item.provider}:${item.modelId} gặp lỗi Quota (429), chuyển model tiếp theo...`)
        }
      }
    }

    if (!activeStream) {
      const errMsg = getErrorMessage(primaryError) || 'Không thể kết nối đến bất kỳ AI Provider nào do hết Quota hoặc Timeout!'
      console.error('❌ [AI Chat Fatal Error]', errMsg)
      throw createError({
        statusCode: 504,
        statusMessage: 'Hệ thống AI đang phản hồi chậm hoặc tạm thời quá tải. Vui lòng thử lại sau giây lát!',
      })
    }

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: activeStream }),
    })
  }
  catch (error: unknown) {
    console.error('[AI Chat Error]', error)
    const statusCode = getErrorStatusCode(error) || 500
    const statusMessage = getErrorMessage(error) || 'Có lỗi xảy ra khi kết nối với AI Server!'
    throw createError({
      statusCode,
      statusMessage,
    })
  }
})
