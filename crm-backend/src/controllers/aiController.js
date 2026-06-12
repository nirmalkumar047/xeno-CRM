const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile";

const SEGMENT_SYSTEM_PROMPT = `You are an AI assistant for BiteLoop CRM, a fast food brand's marketing tool.
Your job is to convert natural language marketing intent into structured segment rules.

Available customer fields and their types:
- totalSpend (number) - total amount spent in rupees
- orderCount (number) - total number of orders placed
- daysSinceLastOrder (number) - days since their last order (computed)
- daysSinceJoined (number) - days since they joined (computed)
- city (string) - customer's city
- favouriteItem (string) - their most ordered item

Available operators: gt (>), gte (>=), lt (<), lte (<=), eq (=), neq (!=), contains

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "segmentName": "string - a short descriptive name",
  "description": "string - one sentence describing this audience",
  "rules": [
    { "field": "fieldName", "operator": "operatorCode", "value": numberOrString }
  ],
  "messagingHint": "string - one sentence about what kind of message would resonate with this audience"
}`;

const MESSAGE_SYSTEM_PROMPT = `You are a marketing copywriter for BiteLoop, a modern fast food brand with the tagline "Every bite, a loop back to you."
BiteLoop menu: Classic Smash Burger, Crispy Chicken Wrap, Loop Fries, BiteBox Combo, Loaded Nachos, Choco Lava Shake, Spicy Crunch Burger, Veggie Pocket.

Write personalised, punchy marketing messages. Keep them short (2-3 sentences max), warm, and on-brand.
Use {firstName} as placeholder for customer's first name, {favouriteItem} for their favourite item.

Respond ONLY with a JSON object (no markdown):
{
  "subject": "Email subject line (max 60 chars)",
  "body": "The message body with personalization placeholders",
  "tone": "One word describing the tone"
}`;

const CHAT_SYSTEM_PROMPT = `You are an AI marketing assistant for BiteLoop CRM. BiteLoop is a fast food brand.
You help marketers create audience segments, draft campaign messages, and understand their customers.

When the user describes a marketing goal, you:
1. Identify the target audience (translate to segment rules)
2. Suggest a message strategy
3. Draft a campaign message

Available segment fields: totalSpend, orderCount, daysSinceLastOrder, daysSinceJoined, city, favouriteItem
Available operators: gt, gte, lt, lte, eq, neq, contains

Respond conversationally but always end with a JSON block if you've created a segment/message.
Format your JSON block as: <ACTION>{"type":"create_segment","data":{...}}</ACTION> or <ACTION>{"type":"create_campaign","data":{...}}</ACTION>

For create_segment, data should have: segmentName, description, rules[]
For create_campaign, data should have: name, subject, messageBody (with {firstName} placeholder)`;

const chat = async (req, res) => {
  try {
    const { messages, context } = req.body;

    const systemMessage = {
      role: "system",
      content: CHAT_SYSTEM_PROMPT + (context ? `\n\nCurrent context: ${JSON.stringify(context)}` : ""),
    };

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = completion.choices[0].message.content;

    // Extract action if present
    const actionMatch = reply.match(/<ACTION>([\s\S]*?)<\/ACTION>/);
    let action = null;
    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1]);
      } catch (e) {
        console.warn("Could not parse action:", e.message);
      }
    }

    const cleanReply = reply.replace(/<ACTION>[\s\S]*?<\/ACTION>/g, "").trim();

    res.json({ reply: cleanReply, action });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const parseSegment = async (req, res) => {
  try {
    const { intent } = req.body;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SEGMENT_SYSTEM_PROMPT },
        { role: "user", content: intent },
      ],
      temperature: 0.3,
      max_tokens: 512,
    });

    const raw = completion.choices[0].message.content.trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const draftMessage = async (req, res) => {
  try {
    const { segmentDescription, intent } = req.body;

    const userPrompt = `Segment: ${segmentDescription}\nCampaign goal: ${intent || "Re-engage customers and drive a purchase"}`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: MESSAGE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 256,
    });

    const raw = completion.choices[0].message.content.trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { chat, parseSegment, draftMessage };
