# Error Alert Template

Short and actionable. Gets posted immediately when a pipeline fails.

```
*{business_name} — Pipeline Error*

*What failed:* {pipeline_name}
*When:* {timestamp}
*Error:* {error_message}

*Last successful run:* {last_success_timestamp} ({time_ago})
*Action needed:* {suggested_action}
```

## Rules
- Keep under 500 characters
- Include the actual error message, not a summary
- If the error is a known pattern (NotebookLM auth expired, git push rejected, API rate limit), suggest the specific fix
- Always include when it last worked so the user knows urgency
