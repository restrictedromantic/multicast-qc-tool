from rapidfuzz import fuzz, process
from typing import List, Dict, Tuple, Optional
import re


def normalize_text(text: str) -> str:
    """Normalize text for comparison."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text


def find_line_in_transcription(
    line: str,
    transcription: str,
    threshold: float = 0.75
) -> Tuple[str, float, Optional[str]]:
    """
    Find if a specific line exists in the transcription.
    
    Returns:
        Tuple of (status, confidence, matched_text)
        status: "found", "partial", or "missing"
    """
    norm_line = normalize_text(line)
    norm_trans = normalize_text(transcription)
    
    if not norm_line or not norm_trans:
        return "missing", 0.0, None
    
    if norm_line in norm_trans:
        return "found", 1.0, line
    
    ratio = fuzz.partial_ratio(norm_line, norm_trans) / 100.0
    
    if ratio >= threshold:
        return "found", ratio, extract_matched_portion(line, transcription)
    elif ratio >= 0.5:
        return "partial", ratio, extract_matched_portion(line, transcription)
    else:
        return "missing", ratio, None


def extract_matched_portion(line: str, transcription: str, window: int = 50) -> Optional[str]:
    """Extract the portion of transcription that best matches the line."""
    norm_line = normalize_text(line)
    norm_trans = normalize_text(transcription)
    
    words = norm_trans.split()
    line_words = norm_line.split()
    
    if len(words) < len(line_words):
        return transcription
    
    best_score = 0
    best_start = 0
    
    for i in range(len(words) - len(line_words) + 1):
        window_text = " ".join(words[i:i + len(line_words) + 5])
        score = fuzz.ratio(norm_line, window_text)
        if score > best_score:
            best_score = score
            best_start = i
    
    matched_words = words[best_start:best_start + len(line_words) + 5]
    return " ".join(matched_words)


def match_lines_to_transcription(
    expected_lines: List[str],
    transcription: str,
    threshold: float = 0.75
) -> List[Dict]:
    """
    Match a list of expected lines against a transcription.
    
    Returns:
        List of dicts with line, status, confidence, and matched_text
    """
    results = []
    
    for line in expected_lines:
        status, confidence, matched = find_line_in_transcription(
            line, transcription, threshold
        )
        results.append({
            "line": line,
            "status": status,
            "confidence": confidence,
            "matched_text": matched
        })
    
    return results


def calculate_qc_stats(match_results: List[Dict]) -> Dict:
    """Calculate QC statistics from match results."""
    total = len(match_results)
    found = sum(1 for r in match_results if r["status"] == "found")
    partial = sum(1 for r in match_results if r["status"] == "partial")
    missing = sum(1 for r in match_results if r["status"] == "missing")
    
    completion = (found + partial * 0.5) / total * 100 if total > 0 else 0
    
    return {
        "total_lines": total,
        "found_lines": found,
        "partial_lines": partial,
        "missing_lines": missing,
        "completion_percentage": round(completion, 1)
    }
