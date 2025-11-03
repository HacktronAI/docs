# Hacktron Documentation

Welcome to the Hacktron documentation repository! This repository contains the [official documentation](https://docs.hacktron.ai) for Hacktron, powered by [Mintlify](https://mintlify.com/).

Before contributing, please read this document carefully to understand our documentation standards and contribution process.

## Contributing

We welcome contributions from the community to improve our documentation, e.g. fixing typos, adding examples, or expanding explanations. To contribute, please follow these steps:

1. Fork this repository
2. Create a new branch for your changes
3. Make your changes in the appropriate `.mdx` files
4. Test your changes locally
5. Submit a pull request describing your changes

### Prerequisites

* Node.js 18 or higher

* Git

* A code editor (we recommend VS Code with MDX extension)

### Local Development

1. Start the development server:

```bash
mintlify dev
```

1. Visit `http://localhost:3000` to preview changes

2. Make changes to `.mdx` files and see them live-reload

### Environment Setup

For VS Code users, we recommend installing these extensions:

* MDX

* Prettier

* Tailwind CSS IntelliSense

## Writing Guidelines

### Document Structure

Each document should follow this structure:

```mdx
---
title: 'Document Title'
description: 'A brief description of the content'
---

## Overview

Brief introduction to the topic.

## Main Content

Your primary content sections.

## Related
- Link to related doc 1
- Link to related doc 2
```

### Component Usage

Use Mintlify components to enhance documentation:

```mdx
<Tabs>
  <Tab title="Example 1">
    Content for example 1
  </Tab>
  <Tab title="Example 2">
    Content for example 2
  </Tab>
</Tabs>

<Steps>
  <Step title="First Step">
    Instructions for first step
  </Step>
</Steps>

<Card>
  Important information here
</Card>
```

### Code Examples

* Use syntax highlighting

* Include comments and write idiomatic code

* Keep examples concise

* Test all code examples

Good example:

```python
def greet(name):
    """Return a greeting message."""
    return f"Hello, {name}!"
```

Bad example:

```python
def greet(name):
    return "Hello, " + name
```
