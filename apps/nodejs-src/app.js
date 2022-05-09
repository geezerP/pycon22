const taskRunner = require('./taskRunner')
const tracer = require('./tracer').Tracer(
    process.env.JAEGER_SERVICE_NAME
)

async function runCommand(cmd) {
    await require('child_process').execSync(cmd)
}

async function taskOne(jobId) {
    await runCommand(`node /usr/src/nodejs-app/worker.js ${jobId}`)
}

async function taskTwo(jobId) {
    await runCommand(`python3 /usr/src/python-app/worker.py ${jobId}`)
}


(async () => {
    while (true) {
        const jobId = Math.floor(new Date() / 1000)
        const mainSpan = await tracer.createSpan(`job-${jobId}`)
        mainSpan.setTag('job-id', jobId)
        mainSpan.log({
            'event': 'debug', 
            'jobid': jobId, 
            'message': `Start new job with id: ${jobId}`
        })
        await tracer.saveContext(jobId, mainSpan.context())
        await taskRunner.simulateOperation(250, 500)
        mainSpan.finish()
        await taskOne(jobId)
        await taskTwo(jobId)
        await taskRunner.simulateOperation(30000, 90000)
    }
}) ()
