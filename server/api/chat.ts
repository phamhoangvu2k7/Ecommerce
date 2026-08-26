import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { convertToModelMessages, createUIMessageStreamResponse, isStepCount, streamText, toUIMessageStream } from 'ai'
import { createError, defineEventHandler, readBody } from 'h3'
import { aiTools } from '~/server/utils/aiTools'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { messages } = body || {}

  if (!messages || !Array.isArray(messages)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Danh sách tin nhắn (messages) không hợp lệ!',
    })
  }

  // Lấy API Keys từ runtimeConfig hoặc process.env
  const config = useRuntimeConfig()
  const geminiApiKey = config.geminiApiKey || process.env.GEMINI_API_KEY
  const openrouterApiKey = config.openrouterApiKey || process.env.OPENROUTER_API_KEY

  if (!geminiApiKey && !openrouterApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Chưa cấu hình GEMINI_API_KEY hoặc OPENROUTER_API_KEY trong file .env!',
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
2. Mỗi khi người dùng hỏi về sản phẩm, danh mục, giá bán hoặc tồn kho, BẮT BUỘC bạn phải gọi các Tools (hàm tra cứu Database) được cung cấp để lấy thông tin mới nhất.
3. KHÔNG ĐƯỢC tự nghĩ ra giá tiền hay thông tin sản phẩm nếu Tool không trả về.
4. Khi trình bày giá tiền, hãy định dạng đẹp mắt (Ví dụ: 250.000 VNĐ).
5. Nếu tìm thấy sản phẩm, hãy khuyến khích khách hàng bấm xem chi tiết hoặc liên hệ cửa hàng.
`

  try {
    const modelMessages = await convertToModelMessages(messages)

    let result
    let primaryError: any = null

    // Bước 1: Thử sử dụng Google Gemini API làm ưu tiên hàng đầu
    if (google) {
      try {
        result = streamText({
          model: google('gemini-2.5-flash'),
          system: systemPrompt,
          messages: modelMessages,
          tools: aiTools,
          stopWhen: isStepCount(5),
        })
      }
      catch (err: any) {
        console.warn('[AI Primary Warning] Google Gemini khởi tạo không thành công, chuẩn bị fallback sang OpenRouter:', err?.message || err)
        primaryError = err
      }
    }

    // Bước 2: Nếu Gemini không khả dụng hoặc bị lỗi, tự động chuyển sang OpenRouter
    if (!result && openrouter) {
      console.warn('[AI Fallback] Đang chuyển đổi sang OpenRouter Free Model (google/gemini-2.5-flash:free)...')
      result = streamText({
        model: openrouter('google/gemini-2.5-flash:free'),
        system: systemPrompt,
        messages: modelMessages,
        tools: aiTools,
        stopWhen: isStepCount(5),
      })
    }

    if (!result) {
      throw primaryError || new Error('Không thể kết nối đến bất kỳ AI Provider nào (Gemini hoặc OpenRouter)!')
    }

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    })
  }
  catch (error: any) {
    console.error('[AI Chat Error]', error)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Có lỗi xảy ra khi kết nối với AI Server!',
    })
  }
})
