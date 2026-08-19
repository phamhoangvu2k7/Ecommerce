import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createUIMessageStreamResponse, isStepCount, streamText, toUIMessageStream } from 'ai'
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

  // Lấy Gemini API Key từ runtimeConfig hoặc process.env
  const config = useRuntimeConfig()
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Chưa cấu hình GEMINI_API_KEY trong file .env!',
    })
  }

  // Khởi tạo Google Provider với API Key
  const google = createGoogleGenerativeAI({
    apiKey,
  })

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
    // Trả về luồng dữ liệu streaming trực tiếp cho Client
    const result = streamText({
      model: google('gemini-2.0-flash'),
      system: systemPrompt,
      messages,
      tools: aiTools,
      stopWhen: isStepCount(5), // Cho phép AI suy luận và gọi Tool liên tiếp tối đa 5 bước
    })

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






