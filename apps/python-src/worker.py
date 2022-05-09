import sys
import os 
from taskRunner import simulateOperation
from tracer import Tracer

class Worker:
    def __init__(self, id):
        self.id = id
        
    def load_data(self):
        simulateOperation(
            minDelay=.175, maxDelay=.225, failure=0.1
        )

    def save_data(self):
        simulateOperation(
            minDelay=.380, maxDelay=.700, failure=.2
        )

    def process_data(self):
        simulateOperation(
            minDelay=1.5, maxDelay=2.5
        )

    def execute_task(self):
        tracer = Tracer()
        span = tracer.create_continuation_span(
            span_name='w2-{}'.format(self.id),
            context_id=self.id
        )
        span.set_tag('job-id', self.id)
        span.log_kv({
            'event': 'debug', 
            'message': 'Start execution for job id: {}'.format(self.id)
        })
        try:
            childSpan = tracer.create_span(
                span_name='load-data',
                parent_span=span
            )
            self.load_data()
            childSpan.finish()
            childSpan = tracer.create_span(
                span_name='process-data',
                parent_span=span
            )
            self.process_data()
            childSpan.finish()
            childSpan = tracer.create_span(
                span_name='save-data',
                parent_span=span
            )
            self.save_data()
            childSpan.finish()
        except Exception as e:
            span.set_tag('error', e)
        finally:
            span.log_kv({
                'event': 'debug', 
                'message': 'End executionfor job id: {}'.format(self.id)
            })
            span.finish()
            tracer.flush_spans()

if __name__ == "__main__":
    Worker(id=sys.argv[1]).execute_task()
    simulateOperation(.75)
    sys.exit(0)
    