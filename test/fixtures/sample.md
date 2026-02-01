# Sample Markdown Document

This is a comprehensive sample markdown file used for testing the MaraudersMapMD extension.

## Introduction

The purpose of this document is to provide a realistic markdown fixture with various formatting elements that the extension needs to handle correctly.

### Key Features

- **Bold text** for emphasis
- *Italic text* for secondary emphasis
- `inline code` for technical terms
- [Links](https://example.com) to external resources
- ![Sample Image](./assets/sample.png) for image references

## Code Examples

Here's a code block with syntax highlighting:

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`;
}

const result = greet('World');
console.log(result);
```

And here's a Python example:

```python
def calculate_sum(numbers):
    """Calculate the sum of a list of numbers."""
    return sum(numbers)

result = calculate_sum([1, 2, 3, 4, 5])
print(f"Sum: {result}")
```

## Lists and Task Lists

### Unordered List

- First item
- Second item
  - Nested item 1
  - Nested item 2
- Third item

### Ordered List

1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step

### Task List

- [x] Completed task
- [ ] Pending task
- [x] Another completed task
- [ ] Work in progress

## Blockquotes

> This is a blockquote. It can contain multiple lines and is useful for highlighting important information.
>
> It can also have multiple paragraphs.

## Tables

| Feature | Status | Priority |
|---------|--------|----------|
| Preview | ✓ | High |
| Export | ✓ | High |
| History | ✓ | Medium |
| AI Support | ✓ | Medium |

## Horizontal Rule

---

## Special Formatting

This paragraph contains ***bold and italic*** text combined. It also has ~~strikethrough~~ text for showing deletions.

### Nested Heading

Some content under a nested heading to test heading hierarchy extraction.

#### Even Deeper

This is a level 4 heading for testing deep nesting.

## Links and References

- [Inline link](https://example.com)
- [Link with title](https://example.com "Example Site")
- [Reference link][ref1]

[ref1]: https://example.com/reference

## Conclusion

This sample markdown file demonstrates the various markdown elements that the MaraudersMapMD extension needs to handle correctly, including headings, lists, code blocks, images, links, and formatting.

---

*Last updated: 2024*
