const OpenAI = require('openai');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const SITE_URL = process.env.SITE_URL || 'https://shopify-success-hub.onrender.com';
const AFFILIATE_LINK = process.env.AFFILIATE_LINK || 'https://shopify.pxf.io/Qj5oDz';

// Load prompts from config
let prompts = {};
try {
    const promptsPath = path.join(__dirname, 'config', 'prompts.json');
    if (fs.existsSync(promptsPath)) {
        prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
    }
} catch (error) {
    logger.error(`Failed to load prompts.json: ${error.message}`);
}

// Helper function to generate content
async function generateContent(systemPrompt, userPrompt, maxTokens = 2000) {
    try {
        logger.pending(`Generating content with ${MODEL}...`);

        const completion = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            max_tokens: maxTokens,
            temperature: 0.8,
        });

        const content = completion.choices[0].message.content;
        const tokensUsed = completion.usage.total_tokens;
        const estimatedCost = calculateCost(tokensUsed);

        logger.success(`Generated content: ${tokensUsed} tokens, ~$${estimatedCost}`);

        return content;
    } catch (error) {
        logger.error(`OpenAI error: ${error.message}`);
        throw error;
    }
}

// Calculate cost for GPT-4o-mini
function calculateCost(tokens) {
    // GPT-4o-mini pricing: $0.15 per 1M input, $0.60 per 1M output
    // We'll use average of $0.375 per 1M tokens
    const avgCostPer1M = 0.375;
    return ((tokens / 1000000) * avgCostPer1M).toFixed(4);
}

// Generate Reddit value post
async function generateRedditPost() {
    const systemPrompt = `You are a helpful Shopify expert creating Reddit posts.
Your goal is to provide genuine value while naturally mentioning resources.

Site: ${SITE_URL}
Affiliate link: ${AFFILIATE_LINK}

Guidelines:
- Be conversational and authentic (not salesy)
- Focus on providing actionable advice
- Share personal experience or insights
- Only mention resources when genuinely relevant
- Use Reddit-style formatting (line breaks, bullets)`;

    const userPrompt = prompts.reddit?.valuePost || `Create a helpful Reddit post for r/shopify about starting a Shopify store.
Include 5 actionable tips that beginners can implement today.
At the end, naturally mention "I created a free guide if anyone wants more details" and include the site URL.
Keep it 300-500 words, conversational tone.`;

    return await generateContent(systemPrompt, userPrompt, 1000);
}

// Generate Reddit comment
async function generateRedditComment(questionContext = '') {
    const systemPrompt = `You are answering a Shopify question on Reddit.
Provide specific, actionable advice. Be helpful, not promotional.

If genuinely relevant, you can mention:
- Free calculator: ${SITE_URL}/calculator.html
- Beginner guide: ${SITE_URL}/guide-how-to-start.html

Only mention if it truly helps answer the question!`;

    const userPrompt = prompts.reddit?.comment || `Generate a helpful comment answering a Shopify beginner question.
Be specific and actionable. Include 2-3 concrete tips.
${questionContext ? `Question context: ${questionContext}` : ''}
Keep it under 200 words.`;

    return await generateContent(systemPrompt, userPrompt, 500);
}

// Generate Twitter thread
async function generateTwitterThread() {
    const systemPrompt = `You create viral Twitter threads about Shopify and ecommerce.

Your threads:
- Start with a compelling hook
- Include specific numbers and data
- Provide actionable advice
- End with a clear CTA

Site: ${SITE_URL}
Resources to mention: Free profit calculator, beginner guides`;

    const userPrompt = prompts.twitter?.thread || `Create a viral Twitter thread (10-15 tweets) about Shopify success.

Start with a hook like:
"I analyzed 100 successful Shopify stores. Here are the 10 things they ALL do:"

Include:
- Specific numbers and statistics
- Actionable steps
- Real examples
- End with CTA to check out the free profit calculator

Format: Number each tweet (1/15, 2/15, etc.)`;

    const content = await generateContent(systemPrompt, userPrompt, 2000);

    // Split into individual tweets (separated by numbers like "1/15")
    const tweets = content.split(/\n(?=\d+\/\d+)/).map(t => t.trim()).filter(t => t);

    return {
        fullThread: content,
        tweets: tweets
    };
}

// Generate Quora answer
async function generateQuoraAnswer(question = '') {
    const systemPrompt = `You write comprehensive Quora answers about Shopify.

Your answers:
- Show expertise and experience
- Include specific steps and examples
- Use formatting (bold, bullets, numbered lists)
- Naturally include helpful resources when relevant

Site: ${SITE_URL}
Resources: Beginner guide, calculator, case studies`;

    const userPrompt = prompts.quora?.answer || `Write a comprehensive Quora answer (500-1000 words) about ${question || 'starting a successful Shopify store'}.

Include:
- Personal experience or insights
- Specific action steps
- Realistic expectations and timelines
- Common mistakes to avoid
- 1-2 links to helpful resources (naturally integrated)

Use formatting:
**Bold for key points**
• Bullet lists
1. Numbered steps`;

    return await generateContent(systemPrompt, userPrompt, 1500);
}

// Generate Medium article
async function generateMediumArticle() {
    const systemPrompt = `You write engaging Medium articles about Shopify and ecommerce.

Your articles:
- Start with a compelling story or statistic
- Include personal experience
- Use subheadings every 3-4 paragraphs
- Provide actionable advice
- End with a clear takeaway

Site: ${SITE_URL}`;

    const userPrompt = prompts.medium?.article || `Write a 1500-2500 word Medium article about Shopify success strategies.

Title ideas:
- "How I Built a $50K/Month Shopify Store (And How You Can Too)"
- "The Shopify Playbook: 10 Strategies That Actually Work"
- "From Zero to $100K: My Shopify Journey"

Structure:
1. Compelling intro with a hook
2. Personal story or case study
3. 5-7 actionable strategies (with subheadings)
4. Real examples and numbers
5. Conclusion with clear takeaways

Naturally include 2-3 links to helpful resources.
Use first person for authenticity.`;

    return await generateContent(systemPrompt, userPrompt, 3000);
}

// Generate LinkedIn post
async function generateLinkedInPost() {
    const systemPrompt = `You create professional LinkedIn posts about ecommerce and entrepreneurship.

Your posts:
- Professional but conversational
- Include business lessons or insights
- Use line breaks for readability
- Include relevant hashtags

Focus: Shopify, ecommerce, online business`;

    const userPrompt = prompts.linkedin?.post || `Create a professional LinkedIn post (150-300 words) about Shopify/ecommerce.

Share:
- A business lesson you learned
- An interesting insight or trend
- Actionable advice for entrepreneurs

Format:
- Short paragraphs (1-2 sentences each)
- Line breaks for readability
- End with 3-5 hashtags: #Shopify #Ecommerce #Entrepreneurship #OnlineBusiness

Professional but approachable tone.`;

    return await generateContent(systemPrompt, userPrompt, 600);
}

// Generate Pinterest pin description
async function generatePinterestDescription() {
    const systemPrompt = `You create SEO-optimized Pinterest pin descriptions for Shopify content.

Your descriptions:
- Include target keywords
- Clear value proposition
- Strong call-to-action
- 150-300 characters

Keywords: Shopify, ecommerce, online store, dropshipping, business`;

    const userPrompt = prompts.pinterest?.description || `Create a Pinterest pin description (150-300 characters) for Shopify content.

Include:
- Keywords: Shopify, ecommerce, online store
- Clear benefit/value
- Call-to-action (e.g., "Learn more", "Get the guide")

Make it compelling and click-worthy!`;

    return await generateContent(systemPrompt, userPrompt, 300);
}

// Generate YouTube comment
async function generateYouTubeComment() {
    const systemPrompt = `You write helpful YouTube comments on Shopify tutorial videos.

Your comments:
- Add value (share a tip or insight)
- Be genuine and supportive
- Keep it brief (under 150 words)
- Only mention resources if truly relevant

Avoid being spammy!`;

    const userPrompt = prompts.youtube?.comment || `Write a helpful YouTube comment for a Shopify tutorial video.

Share:
- A useful tip that adds to the video
- Your own experience
- Appreciation for the content

If genuinely relevant, mention the free calculator or guide.
Keep it under 150 words, friendly tone.`;

    return await generateContent(systemPrompt, userPrompt, 400);
}

// Generate Facebook group post
async function generateFacebookPost() {
    const systemPrompt = `You create engaging Facebook posts for Shopify entrepreneur groups.

Your posts:
- Ask engaging questions or share tips
- Be genuine and conversational
- Focus on community value
- 200-400 words

Site: ${SITE_URL}`;

    const userPrompt = prompts.facebook?.groupPost || `Create a Facebook group post for Shopify entrepreneur groups.

Options:
- Ask a thought-provoking question about ecommerce
- Share a helpful tip or lesson learned
- Start a discussion about common challenges

Be authentic, provide value first.
If relevant, mention helpful resources.
200-400 words.`;

    return await generateContent(systemPrompt, userPrompt, 800);
}

// Generate all daily content at once (more efficient)
async function generateDailyContent() {
    logger.info('🤖 Generating all daily content...');

    const content = {};

    try {
        // Generate content for each platform
        content.reddit = {
            post: await generateRedditPost(),
            comment: await generateRedditComment()
        };

        content.twitter = await generateTwitterThread();

        content.quora = await generateQuoraAnswer();

        // Medium only 3x per week
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
            content.medium = await generateMediumArticle();
        }

        content.linkedin = await generateLinkedInPost();

        content.pinterest = await generatePinterestDescription();

        content.youtube = await generateYouTubeComment();

        content.facebook = await generateFacebookPost();

        logger.success('✅ All content generated successfully!');

        return content;
    } catch (error) {
        logger.error(`Error generating daily content: ${error.message}`);
        throw error;
    }
}

module.exports = {
    generateContent,
    generateRedditPost,
    generateRedditComment,
    generateTwitterThread,
    generateQuoraAnswer,
    generateMediumArticle,
    generateLinkedInPost,
    generatePinterestDescription,
    generateYouTubeComment,
    generateFacebookPost,
    generateDailyContent
};
