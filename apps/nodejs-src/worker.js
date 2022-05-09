const taskRunner = require(`./taskRunner.js`)
const tracer = require(`./tracer.js`).Tracer(
    process.env.JAEGER_NODEJS_APP_NAME
)
const tags = require('opentracing').Tags

class Worker {
    constructor(id, parentSpan) {
        this.id = id
        this.parentSpan = parentSpan
    }

    async executeHttpRequest(url) {
        const opName = 'http-request'
        const span = tracer.createSpan(opName, this.parentSpan)
        span.setTag('job-id', this.id)
        span.setTag(tags.HTTP_METHOD, url)
        await taskRunner.simulateOperation(500, 2500, 0.3)    
        span.log({'event': opName});
        span.finish()
    }

    async loadData() {
        const opName = 'load-data'
        const span = tracer.createSpan(opName, this.parentSpan)
        span.setTag('job-id', this.id)
        await taskRunner.simulateOperation(100, 150, 0.1)
        const rows = []
        for (let index = Math.random() * 100; index > 0; index--) {
            rows.push(index)
        }
        span.log({
            'event': opName, 
            'rows-count': rows.length, 
            'message': 'Data loaded from db'
        })
        span.finish()
    }

    async processData() {
        const opName = 'process-data'
        const span = tracer.createSpan(opName, this.parentSpan)
        span.setTag('job-id', this.id)
        await taskRunner.simulateOperation(500, 1500)
        const value = Math.random() * 10
        span.log({
            'event': opName, 
            'result-value': value, 
            'message': 'Data processed'})
        span.finish()
        return value
    }

    async saveData() {
        const opName = 'save-data'
        const span = tracer.createSpan(opName, this.parentSpan)
        span.setTag('job-id', this.id)
        await taskRunner.simulateOperation(200, 250, 0.1)
        span.log({
            'event': opName, 
            'message': 'Result correctly saved on db'});
        span.finish()
    }
}

(async (jobId) => {
    const parentSpan = await tracer.createContinuationSpan(
        `w1-${jobId}`, jobId
    ) 
    parentSpan.setTag('job-id', jobId)
    parentSpan.log({
            'event': 'debug', 
            'job-id': jobId, 
            'message': `Start execution for job id: ${jobId}`
    })
    try {
        const worker = new Worker(jobId, parentSpan)
        await worker.executeHttpRequest('https://request-to-url.com/')
        await worker.loadData()
        await worker.processData()
        await worker.saveData()
    } catch(err) {
        parentSpan.setTag(tags.ERROR, true)
        parentSpan.log({
            'event': 'error', 
            'error.object': err, 
            'message': err.message, 
            'stack': err.stack
        })
    }
    parentSpan.log({
        'event': 'debug', 
        'job-id': jobId, 
        'message': `End execution for job id: ${jobId}`
    })
    parentSpan.finish()
    setTimeout(() => {
        process.exit(0)
    }, 1000)
})(process.argv[2])