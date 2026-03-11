import twilio from 'twilio'

// Lazy-initialize the Twilio client to avoid errors at build time
let _client: ReturnType<typeof twilio> | null = null

export function getTwilioClient() {
  if (!_client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.')
    }

    _client = twilio(accountSid, authToken)
  }
  return _client
}

/**
 * Validate that an incoming request is genuinely from Twilio.
 * In production, always enable this. In development you can skip it.
 */
export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) return false

  return twilio.validateRequest(authToken, signature, url, params)
}

/**
 * Build a TwiML voice response for the initial greeting.
 * Uses Amazon Polly neural voice for natural-sounding speech.
 */
export function buildGreetingTwiml(
  greeting: string,
  gatherActionUrl: string,
  language: string = 'en-US'
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${gatherActionUrl}" method="POST" 
          speechTimeout="auto" speechModel="phone_call" language="${language}"
          timeout="10">
    <Say voice="alice" language="${language}">${escapeXml(greeting)}</Say>
  </Gather>
  <Say voice="alice">Sorry, I didn't hear anything. Please call back and I'll be happy to help. Goodbye!</Say>
  <Hangup/>
</Response>`
}

/**
 * Build a TwiML response that speaks and then listens for the next input.
 */
export function buildSpeakAndListenTwiml(
  text: string,
  gatherActionUrl: string,
  language: string = 'en-US'
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${gatherActionUrl}" method="POST"
          speechTimeout="auto" speechModel="phone_call" language="${language}"
          timeout="8">
    <Say voice="alice" language="${language}">${escapeXml(text)}</Say>
  </Gather>
  <Say voice="alice">I didn't catch that. Let me transfer you to our staff. One moment please.</Say>
  <Hangup/>
</Response>`
}

/**
 * Build a TwiML response that speaks and then hangs up.
 */
export function buildFarewellTwiml(text: string, language: string = 'en-US'): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="${language}">${escapeXml(text)}</Say>
  <Pause length="1"/>
  <Hangup/>
</Response>`
}

/**
 * Build a TwiML response that transfers the call to a human.
 */
export function buildTransferTwiml(
  text: string,
  transferNumber: string,
  language: string = 'en-US'
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="${language}">${escapeXml(text)}</Say>
  <Pause length="1"/>
  <Dial timeout="30" callerId="${transferNumber}">
    <Number>${transferNumber}</Number>
  </Dial>
  <Say voice="alice">I'm sorry, no one is available right now. Please call back during business hours. Goodbye!</Say>
  <Hangup/>
</Response>`
}

/**
 * Escape special XML characters in text before inserting into TwiML.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
