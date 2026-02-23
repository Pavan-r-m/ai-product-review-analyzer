# Contributing to AI Product Review Analyzer

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🎯 Ways to Contribute

### 1. Code Contributions
- Implement features from [ROADMAP.md](docs/ROADMAP.md)
- Fix bugs and issues
- Improve performance
- Add tests

### 2. Documentation
- Fix typos and clarify instructions
- Add tutorials and examples
- Translate documentation
- Create video guides

### 3. Testing
- Test workflows and report issues
- Add test cases
- Performance testing
- Security testing

### 4. Community
- Answer questions in Issues
- Share your use cases
- Write blog posts
- Create showcase projects

---

## 🚀 Getting Started

### Prerequisites
- Docker Desktop installed
- Basic understanding of n8n
- SQL knowledge (for database contributions)
- JavaScript knowledge (for NLP engine)

### Setup Development Environment

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR-USERNAME/ai-product-review-analyzer.git
cd ai-product-review-analyzer

# 2. Create environment file
cp .env.example .env

# 3. Start services
docker compose up -d

# 4. Access n8n
open http://localhost:5679

# 5. Import workflows
# See workflows/README.md for instructions
```

---

## 📝 Development Guidelines

### Code Style

#### JavaScript (NLP Engine)
```javascript
// Use descriptive variable names
const sentimentScore = calculateSentiment(text);

// Add comments for complex logic
// Calculate modifier based on keyword frequency
const modifier = (positiveCount * 0.1) - (negativeCount * 0.1);

// Use const/let, never var
const TOPIC_KEYWORDS = { ... };

// Format with consistent indentation (2 spaces)
function enrichReview(review) {
  if (!review.text) {
    return defaultEnrichment;
  }
  ...
}
```

#### SQL
```sql
-- Use uppercase for keywords
SELECT sentiment, COUNT(*) 
FROM product_reviews
WHERE review_date >= '2026-01-01';

-- Descriptive table and column names
CREATE TABLE processing_errors (
  id BIGSERIAL PRIMARY KEY,
  review_id TEXT NOT NULL,
  error_message TEXT
);

-- Add comments for complex queries
-- Aggregate reviews by week and calculate average sentiment
SELECT 
  DATE_TRUNC('week', review_date) as week,
  AVG(sentiment_score) as avg_sentiment
FROM product_reviews
GROUP BY week;
```

#### n8n Workflows
- Use descriptive node names ("Normalize Fields" not "Code 1")
- Add notes to complex nodes
- Group related nodes visually
- Test before exporting
- Remove credentials before sharing

---

## 🔧 Making Changes

### Branch Naming Convention

```
feature/add-google-sheets-integration
bugfix/csv-parsing-error
docs/update-installation-guide
refactor/optimize-nlp-engine
test/add-sentiment-tests
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Google Sheets integration
fix: handle empty review text
docs: update README with new features
refactor: optimize sentiment detection algorithm
test: add unit tests for topic detection
chore: update dependencies
```

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow code style guidelines
   - Add tests if applicable
   - Update documentation

3. **Test your changes**
   ```bash
   # Test locally
   docker compose down
   docker compose up -d
   # Import and test workflows
   ```

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Use descriptive title
   - Explain what and why
   - Link related issues
   - Add screenshots if UI changes

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
How was this tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No breaking changes (or documented)

## Screenshots (if applicable)

## Related Issues
Closes #123
```

---

## 🧪 Testing Guidelines

### Manual Testing Checklist

For NLP Engine changes:
- [ ] Test with various ratings (1-5)
- [ ] Test with empty/null text
- [ ] Test with very long text (>1000 chars)
- [ ] Test with special characters
- [ ] Verify sentiment classification
- [ ] Verify topic detection
- [ ] Verify urgency levels

For Workflow changes:
- [ ] Test with sample CSV
- [ ] Test with empty CSV
- [ ] Test with large CSV (>1000 rows)
- [ ] Verify database inserts
- [ ] Check duplicate handling
- [ ] Confirm error handling

For Database changes:
- [ ] Test migrations
- [ ] Verify indexes still work
- [ ] Check query performance
- [ ] Ensure backward compatibility

### Automated Tests (Future)

```javascript
// Example test structure
describe('NLP Engine', () => {
  test('detects negative sentiment for low ratings', () => {
    const result = enrichReview({
      rating: 1,
      review_text: 'Terrible product'
    });
    expect(result.sentiment).toBe('negative');
    expect(result.sentiment_score).toBeLessThan(-0.5);
  });
});
```

---

## 📚 Documentation Standards

### README Updates
- Keep Getting Started section up-to-date
- Add new features to feature list
- Update architecture diagram if structure changes

### Code Documentation
```javascript
/**
 * Detect sentiment from rating and review text
 * 
 * @param {number} rating - Product rating (1-5)
 * @param {string} text - Review text
 * @returns {object} - {sentiment: string, sentiment_score: number}
 */
function detectSentiment(rating, text) {
  // Implementation
}
```

### Database Changes
Update `docs/DATABASE.md` with:
- New tables/columns
- Index changes
- Migration scripts

---

## 🎁 Feature Requests

### Before Submitting
1. Check existing issues
2. Review [ROADMAP.md](docs/ROADMAP.md)
3. Consider if it fits project scope

### Feature Request Template
```markdown
## Feature Description
Clear description of the feature

## Problem It Solves
What problem does this address?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches you've thought about

## Priority
Low / Medium / High

## Implementation Estimate
How complex is this? (hours/days/weeks)
```

---

## 🐛 Bug Reports

### Bug Report Template
```markdown
## Description
What's the bug?

## Steps to Reproduce
1. Step one
2. Step two
3. ...

## Expected Behavior
What should happen?

## Actual Behavior
What actually happens?

## Environment
- OS: macOS / Windows / Linux
- Docker version: 
- n8n version:
- Database version:

## Screenshots/Logs
Attach any relevant screenshots or logs

## Possible Solution (optional)
Any ideas on fixing it?
```

---

## 🏆 Recognition

Contributors will be:
- Listed in README.md
- Mentioned in release notes
- Credited in documentation

### Hall of Fame
Top contributors:
1. [Your name could be here!]

---

## 📞 Communication

### Channels
- **GitHub Issues:** Bug reports, feature requests
- **GitHub Discussions:** General questions, ideas
- **Pull Requests:** Code contributions

### Response Time
- Bug reports: 1-2 days
- Feature requests: 3-5 days
- Pull requests: 2-7 days

---

## 🔒 Security

### Reporting Security Issues
**DO NOT** open public issues for security vulnerabilities.

Instead:
1. Email: security@example.com
2. Describe the vulnerability
3. Provide reproduction steps
4. Allow time for fix before disclosure

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## ❓ Questions

Unsure about something? Don't hesitate to ask!

- Open a GitHub Discussion
- Comment on related issues
- Reach out to maintainers

---

## 🙏 Thank You

Every contribution, no matter how small, makes this project better!

- Submit a typo fix? That's a contribution! ✅
- Answer a question? That's a contribution! ✅
- Share on social media? That's a contribution! ✅

**Happy Contributing!** 🎉
