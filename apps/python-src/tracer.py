import opentracing
from opentracing.propagation import Format
import redis
from jaeger_client import Config
import json
import logging
import os

# tracer=opentracing.global_tracer(),

class Tracer: 
    def __init__(self):
        self.tracer = self.__init_tracer()
        self.redis_cli = self.__init_redis()

    def __init_tracer(self):
        logging.getLogger('').handlers = []
        logging.basicConfig(format='%(message)s', level=logging.DEBUG)
        config = Config(
            config={
                'sampler': {
                    'type': os.environ['JAEGER_SAMPLER_TYPE'],
                    'param': os.environ['JAEGER_SAMPLER_PARAM'],
                },
                'local_agent': {
                    'reporting_host': os.environ['JAEGER_AGENT_HOST'],
                    'reporting_port': os.environ['JAEGER_AGENT_PORT_COMPACT'],
                },
                'logging': True,
            },
            service_name=os.environ['JAEGER_PYTHON_APP_NAME'],
        )
        return config.initialize_tracer()

    def __init_redis(self):
        return redis.Redis(
            host=os.environ['REDIS_HOST'], 
            port=os.environ['REDIS_PORT'],
            db=0
        )

    def create_span(self, span_name, parent_span=None):
        if parent_span is None:
            return self.tracer.start_span(operation_name=span_name)
        return self.tracer.start_span(
            operation_name=span_name,
            child_of=parent_span
        )

    def create_continuation_span(self, span_name, context_id):
        return self.create_span(
            span_name, 
            self.extract_span(self.load_context(context_id))
        )
        
    def load_context(self, id):
        if id is None:
            return None
        print('id: {}'.format(id) )
        byte = self.redis_cli.get(id)
        if byte is None:
            return None
        try:
            context = json.loads(byte.decode("utf-8"))
        except Exception as e:
            return e
        return context

    def extract_span(self, context):
        if (context is None):
            return None
        return self.tracer.extract(
            format=Format.TEXT_MAP,
            carrier=context
        )
    
    def flush_spans(self):
        self.tracer.close()

# Inject:
# http_header_carrier = {}
# opentracing.global_tracer().inject(
#     span_context=outbound_span,
#     format=Format.HTTP_HEADERS,
#     carrier=http_header_carrier)


