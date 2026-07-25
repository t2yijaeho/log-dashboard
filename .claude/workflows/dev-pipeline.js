export const meta = {
  name: 'dev-pipeline',
  description: 'Plan → Implement → Test → Review → Release, looping Implement↔Test↔Review until approved or maxRounds is hit',
  phases: [
    { title: 'Plan' },
    { title: 'Implement' },
    { title: 'Test' },
    { title: 'Review' },
    { title: 'Release' },
  ],
}

const TEST_SCHEMA = {
  type: 'object',
  properties: {
    passed: { type: 'boolean' },
    summary: { type: 'string' },
  },
  required: ['passed', 'summary'],
}

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['approved', 'changes-requested'] },
    findings: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdict', 'findings'],
}

const task = args?.task
if (!task) {
  throw new Error('dev-pipeline requires args.task — a description of what to plan/build')
}
const maxRounds = Math.min(Math.max(Number(args?.maxRounds ?? 3), 1), 3)

phase('Plan')
const plan = await agent(
  `Task: ${task}\n\nProduce a decision-complete plan grounded in the current repository. Do not modify files.`,
  { agentType: 'dev-plan', label: 'plan' },
)

phase('Implement')
let implementation = await agent(
  `Implement this task.\n\nTask: ${task}\n\nApproved plan from dev-plan:\n\n${plan}`,
  { agentType: 'dev-implement', label: 'implement (initial)' },
)

let round = 1
let testResult = null
let reviewResult = null
let approved = false

while (round <= maxRounds) {
  phase('Test')
  testResult = await agent(
    `Verify this change.\n\nImplementation summary:\n${implementation}`,
    { agentType: 'dev-test', schema: TEST_SCHEMA, label: `test round ${round}` },
  )

  if (!testResult?.passed) {
    log(`Test round ${round} failed — sending back to Implement`)
    phase('Implement')
    implementation = await agent(
      `Test found problems — fix them.\n\nOriginal task: ${task}\n\nTest report:\n${testResult?.summary ?? '(no summary returned)'}`,
      { agentType: 'dev-implement', label: `implement (fix test round ${round})` },
    )
    round++
    continue
  }

  phase('Review')
  reviewResult = await agent(
    `Review this change.\n\nOriginal task: ${task}\n\nImplementation summary:\n${implementation}\n\nTest summary:\n${testResult.summary}`,
    { agentType: 'dev-review', schema: REVIEW_SCHEMA, label: `review round ${round}` },
  )

  if (reviewResult?.verdict === 'approved') {
    approved = true
    break
  }

  log(`Review round ${round} requested changes — sending back to Implement`)
  phase('Implement')
  implementation = await agent(
    `Review requested changes — address every item.\n\nOriginal task: ${task}\n\nReview findings:\n${(reviewResult?.findings ?? []).join('\n')}`,
    { agentType: 'dev-implement', label: `implement (address review round ${round})` },
  )
  round++
}

if (!approved) {
  log(`Did not reach approval after ${maxRounds} round(s) — stopping for human review`)
  return {
    status: 'needs-human',
    plan,
    lastImplementation: implementation,
    lastTest: testResult,
    lastReview: reviewResult,
  }
}

phase('Release')
const release = await agent(
  `Release this change. It has been reviewed and approved.\n\nOriginal task: ${task}\n\nImplementation summary:\n${implementation}\n\nReview verdict: approved\n\nExternal publication authorized by caller: ${args?.publish === true ? 'yes' : 'no'}. Do not push, publish, or change remote settings unless this value is yes.`,
  { agentType: 'dev-release', label: 'release' },
)

return { status: 'released', plan, implementation, review: reviewResult, release }
