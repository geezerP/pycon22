const sleep = async (msDelay, maxDelay = undefined) => {
    return new Promise((resolve, reject) => {
        if (maxDelay) {
            msDelay = Math.random() * (maxDelay - msDelay) + msDelay
        }
        console.log(msDelay)
        setTimeout(() => { resolve() }, msDelay)
	})
}

exports.simulateOperation = async (msDelay, 
    maxDelay = undefined, failure = undefined) => {
        if (failure && Math.random() < failure)
            throw new Error(`Operation failed!`)
        await sleep(msDelay, maxDelay)
}