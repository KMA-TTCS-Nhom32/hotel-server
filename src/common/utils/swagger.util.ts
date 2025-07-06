export const customSwaggerCss = `
      /* Dark mode theme for Swagger UI */
      body {
        background-color: #1a1a2e;
        color: #f0f0f5;
      }
      
      .swagger-ui {
        background-color: #1a1a2e;
        color: #f0f0f5;
      }
      
      /* Headers and typography */
      .swagger-ui .info .title,
      .swagger-ui .info h1,
      .swagger-ui .info h2,
      .swagger-ui .info h3,
      .swagger-ui .info h4,
      .swagger-ui .info h5,
      .swagger-ui h1,
      .swagger-ui h2,
      .swagger-ui h3,
      .swagger-ui h4,
      .swagger-ui h5 {
        color: #ffffff;
      }
      
      .swagger-ui .info p, 
      .swagger-ui .info li, 
      .swagger-ui .markdown p,
      .swagger-ui .markdown li {
        color: #f0f0f5;
      }
      
      /* Navigation */
      .swagger-ui .topbar {
        background-color: #16213e;
      }
      
      /* Endpoints and Methods */
      .swagger-ui .opblock-tag {
        background-color: #242444;
        color: #ffffff;
        border-bottom: 1px solid #383860;
      }
      
      .swagger-ui .opblock {
        background-color: #242444;
        border: 1px solid #383860;
      }
      
      /* Make sure operation titles are visible */
      .swagger-ui .opblock .opblock-summary-operation-id,
      .swagger-ui .opblock .opblock-summary-method,
      .swagger-ui .opblock .opblock-summary-path,
      .swagger-ui .opblock .opblock-summary-description {
        color: #f0f0f5;
        font-weight: 500;
      }
      
      /* Improve endpoint path contrast */
      .swagger-ui .opblock .opblock-summary-path {
        color: #ffffff;
        font-weight: bold;
        text-shadow: 0px 0px 1px rgba(255,255,255,0.2);
      }
      
      /* HTTP Methods */
      .swagger-ui .opblock.opblock-get {
        background: rgba(97, 175, 254, 0.15);
        border-color: #61affe;
      }
      
      .swagger-ui .opblock.opblock-post {
        background: rgba(73, 204, 144, 0.15);
        border-color: #49cc90;
      }
      
      /* Operation text */
      .swagger-ui .opblock .opblock-summary-description,
      .swagger-ui .opblock .opblock-summary-operation-id,
      .swagger-ui .opblock .opblock-summary-path,
      .swagger-ui .opblock .opblock-summary-path__deprecated {
        color: #f0f0f5;
      }
      
      .swagger-ui .opblock.opblock-put {
        background: rgba(252, 161, 48, 0.15);
        border-color: #fca130;
      }
      
      .swagger-ui .opblock.opblock-delete {
        background: rgba(249, 62, 62, 0.15);
        border-color: #f93e3e;
      }
      
      .swagger-ui .opblock.opblock-patch {
        background: rgba(80, 227, 194, 0.15);
        border-color: #50e3c2;
      }
      
      /* Response section */
      .swagger-ui .responses-wrapper {
        background-color: #242444;
      }
      
      .swagger-ui table thead tr td, 
      .swagger-ui table thead tr th {
        background-color: #1e1e40;
        color: #f0f0f5;
        border-bottom: 1px solid #383860;
      }
      
      /* Models */
      .swagger-ui section.models {
        background-color: #242444;
        border: 1px solid #383860;
      }
      
      .swagger-ui section.models .model-container {
        background-color: #242444;
      }
      
      /* Model schema properties */
      .swagger-ui .model-title,
      .swagger-ui .model .property.primitive,
      .swagger-ui .model .property-name,
      .swagger-ui .model .property-type,
      .swagger-ui .model .property-format,
      .swagger-ui .model .renderedMarkdown p,
      .swagger-ui .model .property {
        color: #f0f0f5;
      }
      
      .swagger-ui .model-toggle:after {
        background: none;
      }

      .swagger-ui .model-toggle .collapsed:after {
        background: none;
        color: #f0f0f5;
      }
      
      /* Code blocks */
      .swagger-ui .microlight {
        background-color: #1e1e40;
        color: #ffffff;
      }
      
      /* Code syntax highlighting */
      .swagger-ui .microlight .headerline,
      .swagger-ui .microlight .string,
      .swagger-ui .microlight .literal,
      .swagger-ui .microlight .number,
      .swagger-ui .microlight .keyword,
      .swagger-ui .microlight .function,
      .swagger-ui .microlight .punctuation {
        color: #e5e5e5;
      }
      
      .swagger-ui .microlight .string {
        color: #7ec699;
      }
      
      .swagger-ui .microlight .number,
      .swagger-ui .microlight .literal {
        color: #f78c6c;
      }
      
      .swagger-ui .microlight .keyword {
        color: #c792ea;
      }
      
      /* Buttons and inputs */
      .swagger-ui .btn {
        background-color: transparent;
        border: 1px solid #4c4c80;
        color: #f0f0f5;
      }
      
      /* Schema dropdowns */
      .swagger-ui select {
        background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23f0f0f5'%3E%3Cpath d='M13.418 7.859a.695.695 0 01.978 0 .68.68 0 010 .969l-3.908 3.83a.697.697 0 01-.979 0l-3.908-3.83a.68.68 0 010-.969.695.695 0 01.978 0L10 11l3.418-3.141z'/%3E%3C/svg%3E");
      }
      
      .swagger-ui .btn:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      .swagger-ui .btn.execute {
        background-color: #5a2ca0;
        border-color: #5a2ca0;
        color: #ffffff;
      }
      
      .swagger-ui .btn.execute:hover {
        background-color: #6a3cb8;
      }
      
      .swagger-ui select,
      .swagger-ui input[type=text],
      .swagger-ui textarea {
        background-color: #1e1e40;
        color: #f0f0f5;
        border: 1px solid #4c4c80;
      }
      
      /* Authorize button */
      .swagger-ui .authorization__btn {
        color: #42a5f5;
        border-color: #42a5f5;
        font-weight: bold;
      }
      
      /* Parameter names and descriptions */
      .swagger-ui .parameters-col_name {
        color: #f0f0f5;
        font-weight: bold;
      }
      
      .swagger-ui .parameters-col_description p {
        color: #f0f0f5;
      }
      
      .swagger-ui .parameter__name, 
      .swagger-ui .parameter__type {
        font-weight: bold;
      }
      
      /* Endpoint text links */
      .swagger-ui a.nostyle,
      .swagger-ui a.nostyle:visited {
        color: #f0f0f5;
        text-decoration: none;
      }
      
      .swagger-ui a.nostyle:hover {
        color: #ffffff;
        text-decoration: underline;
      }
      
      /* Status codes */
      .swagger-ui .response-col_status .response-success {
        color: #4ae8a0;
      }
      
      .swagger-ui .response-col_status .response-error {
        color: #ff5252;
      }
      
      .swagger-ui .response-col_status .response-redirect {
        color: #ffb74d;
      }
      
      /* Response content */
      .swagger-ui .response-col_description__inner div,
      .swagger-ui .response-col_description__inner span,
      .swagger-ui .response-col_description__inner p,
      .swagger-ui .opblock-description-wrapper p,
      .swagger-ui .opblock-external-docs-wrapper p,
      .swagger-ui .opblock-title_normal p {
        color: #f0f0f5;
      }
      
      /* Response headers */
      .swagger-ui .response-col_description__inner h1,
      .swagger-ui .response-col_description__inner h2,
      .swagger-ui .response-col_description__inner h3,
      .swagger-ui .response-col_description__inner h4,
      .swagger-ui .response-col_description__inner h5 {
        color: #ffffff;
      }
      
      /* Response codes */
      .swagger-ui .response-col_status .response-undocumented {
        color: #f0f0f5;
      }
      
      /* Links */
      .swagger-ui .info a {
        color: #42a5f5;
      }
      
      /* Tables */
      .swagger-ui .table-container {
        background-color: #1e1e40;
        color: #f0f0f5;
      }
      
      .swagger-ui tr.response td {
        color: #f0f0f5;
        border-bottom: 1px solid #383860;
      }
      
      .swagger-ui td.col {
        color: #f0f0f5;
      }
      
      /* Schema constraints */
      .swagger-ui .property-format,
      .swagger-ui .property-type {
        color: #c792ea;
      }
      
      /* Required marker */
      .swagger-ui .required {
        color: #ff5252;
      }
      
      /* Try it out section */
      .swagger-ui .try-out__btn {
        background-color: #242444;
        border: 1px solid #383860;
      }
      
      /* Scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: #1a1a2e;
      }
      
      ::-webkit-scrollbar-thumb {
        background: #4c4c80;
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: #6a6a9f;
      }
    `;
