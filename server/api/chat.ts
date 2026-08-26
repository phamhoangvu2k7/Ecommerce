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
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as Record<string, unknown>).message)
  }
  return String(err || '')
}

function getErrorStatusCode(err: unknown): number | null {
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>
    if (typeof obj.status === 'number') return obj.status
    if (typeof obj.statusCode === 'number') return obj.statusCode
  }
  return null
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
    const modelMessages = await convertToModelMessages(messages)
    let activeStream: ReadableStream | null = null
    let primaryError: unknown = null

    // 1. ƯU TIÊN KẾT NỐI OPENROUTER TRƯỚC (Tránh hoàn toàn dính Quota 429 từ Gemini Free Tier)
    if (openrouter) {
      const openRouterModels = [
        'liquid/lfm-2.5-2.6b:free', // ⚡ Model 100% Miễn Phí, phản hồi siêu nhanh ~1.2s & hỗ trợ Tool cực chuẩn
        'nvidia/nemotron-3-ultra-550b-a55b:free', // 🛡️ Model Miễn Phí dự phòng
      ]

      for (const modelId of openRouterModels) {
        try {
          const openrouterResult = streamText({
            model: openrouter(modelId),
            system: systemPrompt,
            messages: modelMessages,
            tools: aiTools,
            stopWhen: isStepCount(5),
            maxRetries: 1,
          })

          const iterator = openrouterResult.fullStream[Symbol.asyncIterator]()
          const first = await iterator.next()

          if (!first.done && first.value && isErrorStreamPart(first.value)) {
            throw first.value.error || new Error(`OpenRouter Error on ${modelId}`)
          }

          activeStream = new ReadableStream({
            async start(controller) {
              if (!first.done && first.value) {
                controller.enqueue(first.value)
              }
              while (true) {
                try {
                  const { done, value } = await iterator.next()
                  if (done) {
                    controller.close()
                    break
                  }
                  controller.enqueue(value)
                }
                catch (streamErr: unknown) {
                  console.error('⚠️ [AI Stream Mid-flight Error]:', getErrorMessage(streamErr))
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
          console.warn(`⚠️ [AI OpenRouter Warning] Model ${modelId} không khả dụng, thử model tiếp theo:`, getErrorMessage(err))
          primaryError = err
        }
      }
    }

    // 2. Dự phòng với Google Gemini nếu OpenRouter gặp sự cố
    if (!activeStream && google) {
      const geminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash']

      for (const modelId of geminiModels) {
        try {
          const geminiResult = streamText({
            model: google(modelId),
            system: systemPrompt,
            messages: modelMessages,
            tools: aiTools,
            stopWhen: isStepCount(5),
            maxRetries: 0,
          })

          const iterator = geminiResult.fullStream[Symbol.asyncIterator]()
          const first = await iterator.next()

          if (!first.done && first.value && isErrorStreamPart(first.value)) {
            throw first.value.error || new Error(`Gemini API Error on ${modelId}`)
          }

          activeStream = new ReadableStream({
            async start(controller) {
              if (!first.done && first.value) {
                controller.enqueue(first.value)
              }
              while (true) {
                try {
                  const { done, value } = await iterator.next()
                  if (done) {
                    controller.close()
                    break
                  }
                  controller.enqueue(value)
                }
                catch (streamErr: unknown) {
                  console.error('⚠️ [AI Gemini Stream Error]:', getErrorMessage(streamErr))
                  controller.enqueue({
                    type: 'text-delta',
                    id: 'error-chunk',
                    delta: '\n\n⚠️ *(Kết nối Gemini bị gián đoạn. Vui lòng thử lại!)*',
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
          console.warn(`⚠️ [AI Gemini Warning] Model ${modelId} gặp sự cố:`, getErrorMessage(err))
          primaryError = err

          const errMsg = getErrorMessage(err).toLowerCase()
          const errCode = getErrorStatusCode(err)
          if (errCode === 429 || errMsg.includes('quota') || errMsg.includes('rate limit')) {
            console.warn('⚡ [AI Gemini] Gemini API Key đã dính Quota Exceeded (429).')
            break
          }
        }
      }
    }

    if (!activeStream) {
      const errMsg = getErrorMessage(primaryError) || 'Không thể kết nối đến bất kỳ AI Provider nào do hết Quota / Rate Limit!'
      console.error('❌ [AI Chat Fatal Error]', errMsg)
      throw createError({
        statusCode: 429,
        statusMessage: errMsg,
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
