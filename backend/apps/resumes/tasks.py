import logging
from celery import shared_task
from .services import process_resume

logger = logging.getLogger(__name__)

@shared_task(
    bind=True,
    queue='ingest',
    max_retries=2,
    default_retry_delay=5,
    acks_late=True
)
def process_resume_pipeline(self, resume_id: str):
    """
    Celery task wrapper to process a candidate's uploaded resume asynchronously.
    """
    logger.info("Starting resume processing task for Resume ID %s", resume_id)
    try:
        resume = process_resume(resume_id)
        return {
            "status": resume.status if resume else "failed",
            "resume_id": resume_id
        }
    except Exception as exc:
        logger.error("Error in process_resume_pipeline task: %s", str(exc))
        raise self.retry(exc=exc)
