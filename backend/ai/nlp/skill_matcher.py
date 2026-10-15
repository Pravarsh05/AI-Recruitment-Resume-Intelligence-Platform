import re
from typing import List, Dict, Any, Optional, Set, Tuple

# Baseline curated taxonomy with canonical names, categories, and common aliases
CURATED_TAXONOMY = [
    # Languages
    {"name": "Python", "category": "language", "aliases": ["python3", "py"]},
    {"name": "JavaScript", "category": "language", "aliases": ["js", "es6", "ecmascript"]},
    {"name": "TypeScript", "category": "language", "aliases": ["ts"]},
    {"name": "Java", "category": "language", "aliases": ["core java", "j2ee"]},
    {"name": "C++", "category": "language", "aliases": ["cpp", "cplusplus"]},
    {"name": "C#", "category": "language", "aliases": ["csharp", "c sharp"]},
    {"name": "Go", "category": "language", "aliases": ["golang"]},
    {"name": "Rust", "category": "language", "aliases": ["rustlang"]},
    {"name": "PHP", "category": "language", "aliases": ["php7", "php8"]},
    {"name": "Ruby", "category": "language", "aliases": ["ruby on rails"]},
    {"name": "Swift", "category": "language", "aliases": ["swift5"]},
    {"name": "Kotlin", "category": "language", "aliases": []},
    {"name": "SQL", "category": "language", "aliases": ["structured query language", "t-sql", "pl/sql"]},
    {"name": "R", "category": "language", "aliases": ["r-lang"]},
    {"name": "HTML5", "category": "language", "aliases": ["html"]},
    {"name": "CSS3", "category": "language", "aliases": ["css", "scss", "sass"]},

    # Frameworks & Libraries
    {"name": "React", "category": "framework", "aliases": ["reactjs", "react.js"]},
    {"name": "Next.js", "category": "framework", "aliases": ["nextjs", "next"]},
    {"name": "Vue.js", "category": "framework", "aliases": ["vue", "vuejs", "vue3"]},
    {"name": "Angular", "category": "framework", "aliases": ["angularjs", "angular 2+"]},
    {"name": "Node.js", "category": "framework", "aliases": ["nodejs", "node"]},
    {"name": "Django", "category": "framework", "aliases": ["django rest framework", "drf"]},
    {"name": "FastAPI", "category": "framework", "aliases": ["fast-api"]},
    {"name": "Flask", "category": "framework", "aliases": []},
    {"name": "Express.js", "category": "framework", "aliases": ["express", "expressjs"]},
    {"name": "Spring Boot", "category": "framework", "aliases": ["spring", "springboot"]},
    {"name": ".NET Core", "category": "framework", "aliases": [".net", "dotnet", "asp.net"]},
    {"name": "Tailwind CSS", "category": "framework", "aliases": ["tailwind"]},
    {"name": "PyTorch", "category": "framework", "aliases": ["torch"]},
    {"name": "TensorFlow", "category": "framework", "aliases": ["tf", "keras"]},
    {"name": "Scikit-Learn", "category": "framework", "aliases": ["sklearn"]},
    {"name": "Pandas", "category": "framework", "aliases": []},
    {"name": "NumPy", "category": "framework", "aliases": []},

    # Databases
    {"name": "PostgreSQL", "category": "database", "aliases": ["postgres", "psql", "pgvector"]},
    {"name": "MySQL", "category": "database", "aliases": ["mariadb"]},
    {"name": "MongoDB", "category": "database", "aliases": ["mongo"]},
    {"name": "Redis", "category": "database", "aliases": ["redis cache"]},
    {"name": "Elasticsearch", "category": "database", "aliases": ["elastic search", "opensearch"]},
    {"name": "DynamoDB", "category": "database", "aliases": ["aws dynamodb"]},
    {"name": "SQLite", "category": "database", "aliases": ["sqlite3"]},

    # Cloud & DevOps
    {"name": "AWS", "category": "cloud", "aliases": ["amazon web services", "ec2", "s3", "lambda", "fargate", "rds"]},
    {"name": "Google Cloud", "category": "cloud", "aliases": ["gcp", "google cloud platform", "bigquery"]},
    {"name": "Microsoft Azure", "category": "cloud", "aliases": ["azure", "azure devops"]},
    {"name": "Docker", "category": "cloud", "aliases": ["containerization", "containers", "dockerfile"]},
    {"name": "Kubernetes", "category": "cloud", "aliases": ["k8s", "helm"]},
    {"name": "CI/CD", "category": "cloud", "aliases": ["github actions", "gitlab ci", "jenkins", "circleci"]},
    {"name": "Terraform", "category": "cloud", "aliases": ["iac", "infrastructure as code"]},
    {"name": "Linux", "category": "cloud", "aliases": ["unix", "ubuntu", "bash", "shell scripting"]},

    # Tools & Methodologies
    {"name": "Git", "category": "tool", "aliases": ["github", "gitlab", "version control"]},
    {"name": "REST API", "category": "tool", "aliases": ["restful apis", "restful", "rest"]},
    {"name": "GraphQL", "category": "tool", "aliases": ["apollo graphql"]},
    {"name": "Microservices", "category": "domain", "aliases": ["microservice architecture"]},
    {"name": "System Design", "category": "domain", "aliases": ["distributed systems", "high availability"]},
    {"name": "Agile", "category": "domain", "aliases": ["scrum", "kanban", "sprints"]},
    {"name": "Machine Learning", "category": "domain", "aliases": ["ml", "deep learning", "ai", "artificial intelligence"]},
    {"name": "Natural Language Processing", "category": "domain", "aliases": ["nlp", "spacy", "large language models", "llm", "rag"]},
]

# Ambiguous tokens requiring surrounding context validation
AMBIGUOUS_CONTEXT = {
    'go': {'golang', 'goroutine', 'backend', 'concurrency', 'docker', 'kubernetes', 'developer', 'engineer', 'code', 'api'},
    'r': {'statistics', 'statistical', 'data analysis', 'ggplot', 'modeling', 'econometrics', 'python', 'biostatistics'},
    'swift': {'ios', 'apple', 'xcode', 'objective-c', 'mobile', 'uikit', 'swiftui', 'cocoa'},
    'spring': {'java', 'boot', 'microservices', 'hibernate', 'mvc', 'jpa', 'enterprise', 'backend'},
    'net': {'.net', 'c#', 'csharp', 'microsoft', 'asp.net', 'wcf', 'framework'},
}


class SkillMatcher:
    def __init__(self, custom_taxonomy: Optional[List[Dict[str, Any]]] = None):
        self.taxonomy = custom_taxonomy or CURATED_TAXONOMY
        self._build_patterns()

    def _build_patterns(self):
        self.skill_map = {}
        # Precompile lookup patterns
        # For symbol-heavy names: escape them and ensure word boundaries or boundary symbols
        self.compiled_rules = []

        for item in self.taxonomy:
            canonical = item['name']
            category = item.get('category', 'tool')
            all_terms = [canonical] + item.get('aliases', [])

            for term in all_terms:
                term_lower = term.strip().lower()
                self.skill_map[term_lower] = {
                    'canonical': canonical,
                    'category': category,
                }

                # Boundary-safe pattern for symbol-heavy terms
                escaped = re.escape(term_lower)
                if re.search(r'[+#.]', term_lower):
                    pattern_str = r'(?:^|[\s,(\[<>/])(' + escaped + r')(?:[\s,)\].!?:;/\\<>]|$)'
                else:
                    pattern_str = r'\b(' + escaped + r')\b'

                self.compiled_rules.append((
                    re.compile(pattern_str, re.IGNORECASE),
                    term_lower,
                    canonical,
                    category
                ))

    def _split_sentences(self, text: str) -> List[str]:
        # Split text into sentences for evidence extraction
        raw_sentences = re.split(r'(?<=[.!?\n])\s+', text)
        return [s.strip() for s in raw_sentences if len(s.strip()) > 3]

    def extract_skills(self, text: str, sections: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
        """
        Extracts skills from text with confidence scoring, evidence sentence, and category.
        Takes into account section locations (skills section vs experience section).
        """
        if not text:
            return []

        skills_section_text = (sections.get('skills', '') if sections else "").lower()
        experience_section_text = (sections.get('experience', '') if sections else "").lower()
        sentences = self._split_sentences(text)
        full_text_lower = text.lower()

        extracted = {}

        for pattern, term_lower, canonical, category in self.compiled_rules:
            # Check for ambiguous terms
            if term_lower in AMBIGUOUS_CONTEXT:
                # Must either appear in skills section or have contextual terms within 100 characters
                matches = list(pattern.finditer(text))
                if not matches:
                    continue
                valid = False
                if term_lower in skills_section_text:
                    valid = True
                else:
                    required_context = AMBIGUOUS_CONTEXT[term_lower]
                    for match in matches:
                        start = max(0, match.start() - 150)
                        end = min(len(full_text_lower), match.end() + 150)
                        window = full_text_lower[start:end]
                        if any(ctx in window for ctx in required_context):
                            valid = True
                            break
                if not valid:
                    continue
            else:
                matches = list(pattern.finditer(text))
                if not matches:
                    continue

            # Find evidence sentence
            evidence_snippet = ""
            for sentence in sentences:
                if pattern.search(sentence):
                    evidence_snippet = sentence[:250]
                    break

            in_skills_section = canonical.lower() in skills_section_text or term_lower in skills_section_text
            in_exp_section = canonical.lower() in experience_section_text or term_lower in experience_section_text
            occurrence_count = len(pattern.findall(text))

            # Confidence calculation per Section 7.5
            if in_skills_section and in_exp_section:
                confidence = 0.98
            elif in_skills_section:
                confidence = 0.90
            elif occurrence_count >= 3:
                confidence = 0.85
            elif occurrence_count == 2:
                confidence = 0.75
            else:
                confidence = 0.65

            if canonical not in extracted or extracted[canonical]['confidence'] < confidence:
                extracted[canonical] = {
                    'name': canonical,
                    'category': category,
                    'confidence': round(confidence, 2),
                    'evidence': evidence_snippet,
                    'occurrence_count': occurrence_count,
                    'in_skills_section': in_skills_section,
                    'in_experience_section': in_exp_section
                }

        # Return sorted by confidence descending then name
        return sorted(list(extracted.values()), key=lambda x: (-x['confidence'], x['name']))
