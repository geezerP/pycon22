const opentracing = require('opentracing')
const jaegerClient = require('jaeger-client')
const redis = require('redis').createClient({
    host: process.env.REDIS_HOST, 
    port: process.env.REDIS_PORT 
});

class Tracer {
    constructor(name) {
        this.tracer = jaegerClient.initTracerFromEnv({serviceName: name})
    }
    
    createSpan(spanName, parentSpan = undefined) {
        if (parentSpan)
            return this.tracer.startSpan(spanName, {
                childOf: parentSpan
            })
        return this.tracer.startSpan(spanName)
    }

    async createContinuationSpan(spanName, contextId) {
        return this.createSpan(
            spanName, 
            this.extractSpan(await this.loadContext(contextId))
        )
    }
    
    extractSpan(context) {
        if (context) {
            return this.tracer.extract(opentracing.FORMAT_TEXT_MAP, context)
        }
        return undefined
    }
    
    loadContext(id) {
        return new Promise((resolve, reject) => {
            if (!id) resolve(undefined)
            redis.get(id, (err, reply) => {
                if (err) {
                    reject(err)
                }
                if (reply) { 
                    resolve(JSON.parse(reply.toString()))
                } else {
                    resolve(undefined)
                }
            })
        })
    }

    saveContext(id, context) {
        return new Promise((resolve, reject) => {
            var map = {}
            this.tracer.inject(context, opentracing.FORMAT_TEXT_MAP, map)
            redis.set(id, JSON.stringify(map), (err) => {
                if (err) { reject(err) }
                resolve()
            })
        })
    }
}

exports.Tracer = (name) => {
    return tracer = new Tracer(name)
}
