# Documentation Guide

This guide explains how to maintain and extend the CurioPay API documentation.

## Setup

The project uses [MkDocs](https://www.mkdocs.org/) with the [Material](https://squidfunk.github.io/mkdocs-material/) theme for documentation.

### Prerequisites

To build the documentation locally, you need to install MkDocs and the Material theme:

```bash
pip install mkdocs mkdocs-material
```

## Running Documentation Locally

Once installed, you can serve the documentation locally with:

```bash
npm run docs:serve
```

This command will start a local server at http://localhost:8000 where you can preview the documentation.

Alternatively, you can use the direct MkDocs command:

```bash
mkdocs serve
```

## Building Documentation

To build the static site:

```bash
npm run docs:build
```

Or with the direct MkDocs command:

```bash
mkdocs build
```

This will create a `site` directory with the generated static HTML files.

## Documentation Structure

The documentation is organized as follows:

- `docs/index.md`: Main landing page
- `docs/api/`: API reference documentation
- `docs/architecture/`: Architecture and design documentation
- `docs/development/`: Development guides and procedures
- `docs/deployment/`: Deployment instructions

## Adding New Pages

1. Create a new Markdown file in the appropriate directory
2. Add the file to the navigation in `mkdocs.yml`:

```yaml
nav:
  - Home: index.md
  - API Reference:
      - Overview: api/overview.md
      - New Page: api/new-page.md
```

## Markdown Extensions

The documentation supports several Markdown extensions:

### Code Blocks with Syntax Highlighting

````markdown
```javascript
function hello() {
  console.log('Hello, world!');
}
```
````

### Admonitions

```markdown
!!! note "Optional Title"
This is a note admonition.

!!! warning "Warning"
This is a warning admonition.
```

### Tables

```markdown
| Column 1 | Column 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```

## API Documentation Best Practices

When documenting API endpoints:

1. Always include the URL and HTTP method
2. Document request parameters (path, query, body)
3. Document response format and status codes
4. Provide example requests and responses
5. Document authentication requirements
6. Include error responses

Example structure for an endpoint:

````markdown
## Endpoint Name

Brief description of what the endpoint does.

**URL**: `/api/endpoint`

**Method**: `POST`

**Auth required**: Yes

### Request Body

```json
{
  "field1": "value1",
  "field2": "value2"
}
```
````

### Success Response

**Code**: `200 OK`

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

**Code**: `400 BAD REQUEST`

```json
{
  "success": false,
  "error": "Error message"
}
```

```

```
