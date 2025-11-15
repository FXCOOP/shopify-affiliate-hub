# 🤖 AI Subagents for Shopify Automation System

This project includes 5 specialized AI subagents that help optimize, debug, analyze, and scale your automation system.

## 📋 Available Subagents

### 1. 🎨 Content Optimizer (`content-optimizer`)
**Purpose:** Reviews and optimizes all generated content before posting

**Use when:**
- After content generation (automatic)
- Before posting to platforms
- When engagement is low
- To improve conversion rates

**Example:**
```
> Use the content-optimizer to review today's generated posts
```

**What it does:**
- ✅ Scores engagement potential (1-10)
- ✅ Checks platform-specific best practices
- ✅ Suggests headline improvements
- ✅ Optimizes CTAs for conversion
- ✅ Detects spam/policy violations
- ✅ Provides before/after comparisons

---

### 2. 🔧 Platform Debugger (`platform-debugger`)
**Purpose:** Debugs API errors, rate limits, and posting failures

**Use when:**
- API calls fail
- Rate limits are hit
- Posts don't publish
- Authentication errors occur
- Browser automation crashes

**Example:**
```
> Use the platform-debugger to investigate why Reddit posts are failing
```

**What it does:**
- ✅ Analyzes error logs
- ✅ Identifies root cause
- ✅ Provides specific fixes with code
- ✅ Tests the solution
- ✅ Prevents future issues
- ✅ Platform-specific troubleshooting

---

### 3. 📊 Analytics Reporter (`analytics-reporter`)
**Purpose:** Generates performance reports and tracks ROI

**Use when:**
- Weekly (every Monday)
- Monthly (first of each month)
- On-demand for specific metrics
- Before strategic decisions

**Example:**
```
> Use the analytics-reporter to generate this week's performance report
```

**What it does:**
- ✅ Weekly/monthly performance summaries
- ✅ ROI calculation and tracking
- ✅ Platform-by-platform breakdown
- ✅ Growth trends and forecasts
- ✅ Actionable optimization recommendations
- ✅ Revenue projections

---

### 4. 💰 API Monitor (`api-monitor`)
**Purpose:** Monitors OpenAI costs and API usage

**Use when:**
- Daily (before automation runs)
- After each automation run
- When costs seem high
- Budget planning

**Example:**
```
> Use the api-monitor to check today's token usage and costs
```

**What it does:**
- ✅ Tracks token usage in real-time
- ✅ Calculates daily/monthly costs
- ✅ Alerts on budget overruns
- ✅ Suggests cost optimizations
- ✅ Monitors all platform API quotas
- ✅ Forecasts monthly spending

---

### 5. 🚀 Growth Strategist (`growth-strategist`)
**Purpose:** Develops growth strategies to hit $40K/month goal

**Use when:**
- Monthly planning sessions
- Quarterly reviews
- Growth plateaus
- Before major expansions
- Strategic decision-making

**Example:**
```
> Use the growth-strategist to create next month's growth plan
```

**What it does:**
- ✅ Monthly growth roadmaps
- ✅ Identifies high-leverage opportunities
- ✅ Conversion funnel optimization
- ✅ Competitive analysis
- ✅ Scaling strategies
- ✅ A/B test planning

---

## 🎯 How to Use Subagents

### Automatic Invocation
Claude will automatically use subagents when appropriate based on the task description.

### Explicit Invocation
Request a specific subagent:

```
> Use the content-optimizer to review my posts
> Ask the platform-debugger to fix the Twitter error
> Have the analytics-reporter generate this month's summary
> Use the api-monitor to check costs
> Get the growth-strategist to plan next month
```

### Batch Operations
Run multiple subagents:

```
> First use api-monitor to check costs, then use analytics-reporter to generate weekly report
```

---

## 📅 Recommended Schedule

### Daily
- 🟢 **Before automation**: api-monitor (check budget)
- 🟢 **After automation**: platform-debugger (if any errors)

### Weekly (Every Monday)
- 🟡 **Analytics**: analytics-reporter (weekly summary)
- 🟡 **Costs**: api-monitor (weekly cost review)

### Monthly (First of Month)
- 🔴 **Strategy**: growth-strategist (monthly plan)
- 🔴 **Analytics**: analytics-reporter (monthly deep dive)
- 🔴 **Optimization**: content-optimizer (review trends)

### As-Needed
- 🟣 **Content review**: content-optimizer (before posting)
- 🟣 **Debugging**: platform-debugger (when errors occur)

---

## 💡 Pro Tips

1. **Chain subagents** for comprehensive analysis:
   ```
   > Use api-monitor to check costs, then analytics-reporter to calculate ROI, then growth-strategist to plan scaling
   ```

2. **Be specific** about what you want:
   ```
   > Use platform-debugger to investigate Reddit 429 errors from last night
   ```

3. **Request formats** for reports:
   ```
   > Use analytics-reporter to generate weekly report in markdown table format
   ```

4. **Ask for comparisons**:
   ```
   > Use analytics-reporter to compare this week vs last week performance
   ```

5. **Get recommendations**:
   ```
   > Use growth-strategist to identify top 3 growth opportunities for next month
   ```

---

## 🔧 Subagent Configuration

All subagents are configured in `.claude/agents/` directory.

To modify a subagent:
1. Open `.claude/agents/{subagent-name}.md`
2. Edit the system prompt (below the `---` frontmatter)
3. Adjust tools if needed (in frontmatter)
4. Save the file

Claude will automatically use the updated version.

---

## 📊 Expected Outcomes

### With Subagents
- ✅ **98%+ success rate** (platform-debugger catches issues)
- ✅ **+20% engagement** (content-optimizer improves quality)
- ✅ **Stay under $10/month** (api-monitor prevents overruns)
- ✅ **Data-driven decisions** (analytics-reporter provides insights)
- ✅ **Hit $40K/month goal** (growth-strategist plans the path)

### Without Subagents
- ❌ Manual debugging (slower issue resolution)
- ❌ Guessing on optimizations (no data)
- ❌ Unexpected costs (no monitoring)
- ❌ Slower growth (no strategic planning)

---

## 🆘 Getting Help

If a subagent isn't working as expected:

1. **Check the logs:**
   ```bash
   cat automation-system/logs/activity.log | grep -A 10 "subagent"
   ```

2. **Verify subagent exists:**
   ```bash
   ls .claude/agents/
   ```

3. **Test manually:**
   ```
   > Use the {subagent-name} to test if it works
   ```

4. **Re-read subagent config:**
   The subagent system prompt is in `.claude/agents/{name}.md`

---

## 🚀 Next Steps

1. **Test each subagent:**
   ```
   > Use content-optimizer to review a sample post
   > Use platform-debugger to check system health
   > Use analytics-reporter to show current stats
   > Use api-monitor to check today's costs
   > Use growth-strategist to outline next week's goals
   ```

2. **Set up weekly automation:**
   - Every Monday morning: Run analytics-reporter
   - Every day before automation: Run api-monitor

3. **Customize to your needs:**
   - Edit subagent prompts to match your preferences
   - Add new subagents for specific tasks
   - Adjust tool permissions as needed

---

**Your automation system is now powered by 5 specialized AI experts!** 🎉

Each subagent has deep expertise in their domain and will proactively help you build, optimize, and scale your way to $40K/month.
