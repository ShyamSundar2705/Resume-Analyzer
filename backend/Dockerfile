# Use official AWS Lambda Python runtime as base image
FROM public.ecr.aws/lambda/python:3.11

# Copy requirements
COPY backend/lambdas/analyze/requirements.txt ${LAMBDA_TASK_ROOT}/analyze/
COPY backend/lambdas/chat/requirements.txt ${LAMBDA_TASK_ROOT}/chat/
COPY backend/lambdas/presign/requirements.txt ${LAMBDA_TASK_ROOT}/presign/
COPY backend/lambdas/auth/requirements.txt ${LAMBDA_TASK_ROOT}/auth/

# Install all dependencies
RUN pip install -r ${LAMBDA_TASK_ROOT}/analyze/requirements.txt
RUN pip install -r ${LAMBDA_TASK_ROOT}/chat/requirements.txt
RUN pip install -r ${LAMBDA_TASK_ROOT}/auth/requirements.txt

# Download spaCy model for resume analysis
RUN python -m spacy download en_core_web_sm

# Copy Lambda handlers
COPY backend/lambdas/analyze/ ${LAMBDA_TASK_ROOT}/analyze/
COPY backend/lambdas/chat/ ${LAMBDA_TASK_ROOT}/chat/
COPY backend/lambdas/presign/ ${LAMBDA_TASK_ROOT}/presign/
COPY backend/lambdas/auth/ ${LAMBDA_TASK_ROOT}/auth/

# Set the CMD to your handler
CMD [ "analyze/handler.lambda_handler" ]
