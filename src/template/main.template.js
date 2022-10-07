const text = v => v && v.toString() || '';

module.exports = (context = {}) => 
`<!DOCTYPE html>
<html>
<head>
    <title>${text(context.title)}</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${text(context.head)}
</head>
    <body>
    <main class="container">${text(context.content)}</main>
    </body>
</html>
`;