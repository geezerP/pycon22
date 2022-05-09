import time
import random

def sleep(minDelay, maxDelay=None):
    if maxDelay is not None:
        minDelay = random.random() * (maxDelay - minDelay) + minDelay
    time.sleep(minDelay)

def simulateOperation(minDelay, maxDelay=None, failure=None):
    if failure is not None and random.random() < failure:
        raise ValueError('Operation failed!')
    sleep(minDelay, maxDelay)
