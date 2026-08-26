import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { convertToModelMessages, createUIMessageStreamResponse, isStepCount, streamText, toUIMessageStream } from 'ai'
import { createError, defineEventHandler, readBody } from 'h3'
import { aiTools } from '~/server/utils/aiTools.ts'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { messages } = body || {}

  if (!messages || !Array.isArray(messages)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Danh sách tin nhắn (messages) không hợp lệ!',
    })
  }

  // Lấy API Keys tương thích cả máy Local và Cloudflare Pages Workers environment
  const config = useRuntimeConfig(event)
  const cfEnv = (event.context as any)?.cloudflare?.env || {}

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
1. Trả lời người dùng bằng Tiếng Việt lịch sự, tự nhiên và chuyên nghiệp.
2. Mỗi khi người dùng hỏi về sản phẩm, danh mục, giá bán, khoảng giá (ví dụ: dưới 1 triệu, từ 200k đến 500k) hoặc tồn kho, BẮT BUỘC bạn phải sử dụng Tool searchProducts với tham số maxPrice/minPrice tương ứng để truy vấn Database.
3. KHÔNG ĐƯỢC tự nghĩ ra giá tiền hay thông tin sản phẩm nếu Tool không trả về.
4. Khi trình bày giá tiền, hãy định dạng đẹp mắt (Ví dụ: 250.000 VNĐ).
5. Nếu tìm thấy sản phẩm, hãy khuyến khích khách hàng bấm xem chi tiết hoặc liên hệ cửa hàng.
`

  try {
    const modelMessages = await convertToModelMessages(messages)

    let finalStream: ReadableStream | null = null
    let primaryError: any = null

    // 1. Thử kết nối với Google Gemini làm ưu tiên hàng đầu
    if (google) {
      try {
        const geminiResult = streamText({
          model: google('gemini-2.5-flash'),
          system: systemPrompt,
          messages: modelMessages,
          tools: aiTools,
          stopWhen: isStepCount(5),
        })

        // Read & inspect chunk đầu tiên của stream Gemini
        const reader = geminiResult.stream.getReader()
        const firstChunk = await reader.read()

        if (!firstChunk.done && firstChunk.value) {
          const chunkStr = typeof firstChunk.value === 'string'
            ? firstChunk.value
            : JSON.stringify(firstChunk.value)

          if (
            chunkStr.includes('"error"')
            || chunkStr.includes('RESOURCE_EXHAUSTED')
            || chunkStr.includes('Quota exceeded')
            || chunkStr.includes('429')
            || chunkStr.includes('API key')
          ) {
            throw new Error(`[Gemini API Error Payload] ${chunkStr}`)
          }
        }

        finalStream = new ReadableStream({
          async start(controller) {
            if (!firstChunk.done && firstChunk.value) {
              controller.enqueue(firstChunk.value)
            }
            while (true) {
              const { done, value } = await reader.read()
              if (done) {
                controller.close()
                break
              }
              controller.enqueue(value)
            }
          },
          cancel(reason) {
            reader.cancel(reason)
          },
        })
      }
      catch (err: any) {
        console.warn('⚠️ [AI Primary Warning] Gemini API gặp sự cố, tự động kích hoạt Fallback sang OpenRouter:', err?.message || err)
        primaryError = err
      }
    }

    // 2. Nếu Gemini không khả dụng hoặc sập/hết lượt, tự động chuyển sang OpenRouter
    if (!finalStream && openrouter) {
      try {
        console.warn('🚀 [AI Fallback Active] Đang chuyển đổi sang OpenRouter Free Router...')
        const openrouterResult = streamText({
          model: openrouter('openrouter/free'),
          system: systemPrompt,
          messages: modelMessages,
          tools: aiTools,
          stopWhen: isStepCount(5),
        })

        const reader = openrouterResult.stream.getReader()
        const firstChunk = await reader.read()

        if (!firstChunk.done && firstChunk.value) {
          const chunkStr = typeof firstChunk.value === 'string'
            ? firstChunk.value
            : JSON.stringify(firstChunk.value)

          if (
            chunkStr.includes('"error"')
            || chunkStr.includes('429')
            || chunkStr.includes('API key')
          ) {
            throw new Error(`[OpenRouter Error Payload] ${chunkStr}`)
          }
        }

        finalStream = new ReadableStream({
          async start(controller) {
            if (!firstChunk.done && firstChunk.value) {
              controller.enqueue(firstChunk.value)
            }
            while (true) {
              const { done, value } = await reader.read()
              if (done) {
                controller.close()
                break
              }
              controller.enqueue(value)
            }
          },
          cancel(reason) {
            reader.cancel(reason)
          },
        })
      }
      catch (err: any) {
        console.error('❌ [OpenRouter Fallback Error]', err?.message || err)
        primaryError = err
      }
    }

    if (!finalStream) {
      const errMsg = primaryError?.message || 'Không thể kết nối đến bất kỳ AI Provider nào! Vui lòng kiểm tra API Key trong file .env / Cloudflare Dashboard.'
      console.error('❌ [AI Chat Fatal Error]', errMsg)
      throw createError({
        statusCode: 500,
        statusMessage: errMsg,
      })
    }

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: finalStream }),
    })
  }
  catch (error: any) {
    console.error('[AI Chat Error]', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.statusMessage || error?.message || 'Có lỗi xảy ra khi kết nối với AI Server!',
    })
  }
})
