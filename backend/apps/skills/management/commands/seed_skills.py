from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.skills.models import Skill
from ai.nlp.skill_matcher import CURATED_TAXONOMY

# Additional comprehensive skills to seed
ADDITIONAL_SKILLS = [
    # Languages
    {"name": "Bash", "category": "language", "aliases": ["shell", "sh", "zsh"]},
    {"name": "PowerShell", "category": "language", "aliases": ["ps1"]},
    {"name": "Scala", "category": "language", "aliases": []},
    {"name": "Perl", "category": "language", "aliases": []},
    {"name": "Lua", "category": "language", "aliases": []},
    {"name": "Dart", "category": "language", "aliases": ["flutter dart"]},
    {"name": "Solidity", "category": "language", "aliases": ["smart contracts"]},

    # Frameworks
    {"name": "Flutter", "category": "framework", "aliases": ["flutter framework"]},
    {"name": "React Native", "category": "framework", "aliases": ["rn"]},
    {"name": "Svelte", "category": "framework", "aliases": ["sveltekit"]},
    {"name": "Ruby on Rails", "category": "framework", "aliases": ["rails"]},
    {"name": "Laravel", "category": "framework", "aliases": ["php laravel"]},
    {"name": "Symfony", "category": "framework", "aliases": []},
    {"name": "Celery", "category": "framework", "aliases": ["celery worker"]},
    {"name": "NestJS", "category": "framework", "aliases": ["nest.js"]},
    {"name": "Koa", "category": "framework", "aliases": []},
    {"name": "Gatsby", "category": "framework", "aliases": []},
    {"name": "Nuxt.js", "category": "framework", "aliases": ["nuxt"]},
    {"name": "Hugging Face", "category": "framework", "aliases": ["transformers", "huggingface"]},
    {"name": "LangChain", "category": "framework", "aliases": ["langchain framework", "langgraph"]},
    {"name": "LlamaIndex", "category": "framework", "aliases": ["gpt-index"]},

    # Databases
    {"name": "Cassandra", "category": "database", "aliases": ["apache cassandra"]},
    {"name": "Neo4j", "category": "database", "aliases": ["graph database"]},
    {"name": "Firebase", "category": "database", "aliases": ["firestore", "firebase realtime"]},
    {"name": "Supabase", "category": "database", "aliases": []},
    {"name": "ChromaDB", "category": "database", "aliases": ["chroma"]},
    {"name": "Pinecone", "category": "database", "aliases": ["pinecone vector db"]},
    {"name": "Milvus", "category": "database", "aliases": []},
    {"name": "Weaviate", "category": "database", "aliases": []},
    {"name": "Qdrant", "category": "database", "aliases": []},
    {"name": "ClickHouse", "category": "database", "aliases": []},
    {"name": "Snowflake", "category": "database", "aliases": ["snowflake dwh"]},

    # Cloud & Infra
    {"name": "Ansible", "category": "cloud", "aliases": []},
    {"name": "Puppet", "category": "cloud", "aliases": []},
    {"name": "Prometheus", "category": "cloud", "aliases": []},
    {"name": "Grafana", "category": "cloud", "aliases": []},
    {"name": "ArgoCD", "category": "cloud", "aliases": ["argo cd"]},
    {"name": "Nginx", "category": "cloud", "aliases": ["reverse proxy"]},
    {"name": "Apache Kafka", "category": "cloud", "aliases": ["kafka", "event streaming"]},
    {"name": "RabbitMQ", "category": "cloud", "aliases": ["amqp"]},

    # Domain
    {"name": "Unit Testing", "category": "domain", "aliases": ["pytest", "jest", "junit", "tdd"]},
    {"name": "OAuth2", "category": "domain", "aliases": ["oidc", "jwt", "saml"]},
    {"name": "WebSockets", "category": "domain", "aliases": ["realtime web"]},
    {"name": "Computer Vision", "category": "domain", "aliases": ["opencv", "yolo"]},
    {"name": "Data Warehousing", "category": "domain", "aliases": ["etl", "elt", "dbt"]},
    {"name": "Cybersecurity", "category": "domain", "aliases": ["infosec", "pen testing", "owasp"]},
]

class Command(BaseCommand):
    help = 'Seeds the database with canonical skill taxonomy and aliases.'

    def handle(self, *args, **options):
        total_seeded = 0
        all_skills = CURATED_TAXONOMY + ADDITIONAL_SKILLS

        for item in all_skills:
            name = item['name']
            category = item.get('category', Skill.Category.TOOL)
            aliases = item.get('aliases', [])
            slug_base = name.replace('++', 'plusplus').replace('#', 'sharp').replace('.', 'dot')
            slug = slugify(slug_base)

            obj, created = Skill.objects.update_or_create(
                name=name,
                defaults={
                    'slug': slug,
                    'category': category,
                    'aliases': aliases,
                    'is_active': True
                }
            )
            total_seeded += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {total_seeded} skills into taxonomy."))
