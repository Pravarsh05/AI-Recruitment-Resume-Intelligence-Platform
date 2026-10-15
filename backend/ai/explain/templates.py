from typing import Dict, Any, List

def generate_template_explanation(
    breakdown: Dict[str, Any],
    candidate_profile: Dict[str, Any],
    job_details: Dict[str, Any]
) -> str:
    """
    Generates a fully transparent, auditable natural language explanation from structured scoring data.
    Every single statement is deterministic and derived directly from verified inputs.
    """
    score = breakdown.get('score', 0)
    skill_score = breakdown.get('skill_score', 0)
    semantic_score = breakdown.get('semantic_score', 0)
    exp_score = breakdown.get('experience_score', 0)
    edu_score = breakdown.get('education_score', 0)
    knockout_applied = breakdown.get('knockout_applied', False)

    # 1. Qualitative classification
    if score >= 85:
        tier = "Exceptional Match"
    elif score >= 70:
        tier = "Strong Match"
    elif score >= 55:
        tier = "Moderate Match"
    else:
        tier = "Weak Match"

    lines = []
    lines.append(f"**Overall Score: {score}/100 ({tier})**")
    
    # Role context
    job_title = job_details.get('title')
    company = job_details.get('company_name')
    if job_title:
        company_suffix = f" at {company}" if company else ""
        lines.append(f"• **Role:** {job_title}{company_suffix}")

    # Knockout warning if applicable
    if knockout_applied:
        lines.append("> ⚠️ **Knockout Cap Applied:** A mandatory required skill is missing, capping the total score at 60.")

    # 2. Executive summary
    lines.append(
        f"• Skills alignment is at {skill_score:.0f}%, semantic profile similarity is {semantic_score:.0f}%, "
        f"experience fit is {exp_score:.0f}%, and education fit is {edu_score:.0f}%."
    )

    # 3. Experience note
    req_min_exp = job_details.get('min_experience_years', 0)
    cand_exp = candidate_profile.get('total_experience_years', 0)
    if req_min_exp > 0:
        lines.append(f"• **Experience:** Role requests {req_min_exp:.1f}+ years. Candidate profile demonstrates approximately {cand_exp:.1f} years.")

    # 4. Matched skills
    matched = breakdown.get('matched_skills', [])
    if matched:
        top_matches = [m['name'] for m in matched[:8]]
        lines.append(f"• **Key Matched Skills:** {', '.join(top_matches)}.")

    # 5. Missing skills
    missing_req = breakdown.get('missing_required', [])
    if missing_req:
        miss_names = [m['name'] for m in missing_req[:5]]
        lines.append(f"• **Missing Required Skills:** {', '.join(miss_names)}.")

    missing_pref = breakdown.get('missing_preferred', [])
    if missing_pref:
        pref_names = [m['name'] for m in missing_pref[:4]]
        lines.append(f"• **Missing Preferred Skills:** {', '.join(pref_names)}.")

    # 6. Related skill hints
    related = breakdown.get('related_skills', [])
    if related:
        hints = [f"Job requests '{r['job_skill']}', candidate brings related skill '{r['candidate_skill']}' (similarity {r['similarity']})" for r in related[:3]]
        lines.append(f"• **Transferable Skills:** {'; '.join(hints)}.")

    return "\n\n".join(lines)
