<p align="center">
  <a href="#" target="_blank">
    <img width="320" src="./.github/logo.png">
  </a>
</p>
<br>

Simple, lightweight, and flexible schema-based form for Vue.js

## Features
**🧽&nbsp;&nbsp;Flexible:** Easily to handle from basic to nested forms, group of forms...

**⚙️&nbsp;&nbsp;Dynamically:** Generate form components dynamically.

**📝&nbsp;&nbsp;Schema:** Build faster form by schema.

**🐜&nbsp;&nbsp;Lightweight:** Small built size. Gzip: ~5 KB

**✅&nbsp;&nbsp;Validation:** Validate form elements with built-in Rules that covers most needs in most web applications

**🧩&nbsp;&nbsp;Plugins:** Extend functionally by third-party plugins or your own plugins.

**🌵&nbsp;&nbsp;Extensibility:** Easily to make your own custom form element by extending the core elements.

## Links
- [📚 &nbsp; Documentation](https://vue-formily.netlify.app)

## Installation

### CDN
You can use **vue-formily** with a script tag and a CDN, import the library like this:

```html
<script src="https://unpkg.com/@vue-formily/formily@latest"></script>
```

This will inject a `VueFormily` global object, which you will use to access the various components, funtions exposed by **vue-formily**.

If you are using native ES Modules, there is also an ES Modules compatible build:

```html
<script type="module">
  import Vue from 'https://unpkg.com/@vue-formily/formily@latest/dist/formily.esm.js'
</script>
```

### NPM
```sh
# install with yarn
yarn add @vue-formily/formily

# install with npm
npm install @vue-formily/formily --save
```

### Set Up

### Vue 3.x
```typescript
import { createApp } from 'vue'
import { createFormily } from '@vue-formily/formily';

const formily = createFormily();

const app = createApp(App)

app.use(formily, {
  // By default, vue-formily will execute the 
  // validation silently when changing element's value.
  // To disable it, just set the `silent` to `false`.
  // When disabled, the element has to be validated manually 
  // by calling the `element.validate()` method.
  silent?: boolean;
  // The default rules want to apply to the form.
  // With rules that have the `cascade = true`,
  // then thay can apply to all the child elements.
  rules: [];
  // The alias of the object contains all the form references
  // that will be injected to Vue instance
  alias: 'forms';
});
```

#### Vue 2.x
```typescript
import Vue from 'vue';
import VueFormily from '@vue-formily/formily';

Vue.use(VueFormily, {
  // By default, vue-formily will execute the 
  // validation silently when changing element's value.
  // To disable it, just set the `silent` to `false`.
  // When disabled, the element has to be validated manually 
  // by calling the `element.validate()` method.
  silent?: boolean;
  // The default rules want to apply to the form.
  // With rules that have the `cascade = true`,
  // then thay can apply to all the child elements.
  rules: [];
  // The alias of the object contains all the form references
  // that will be injected to Vue instance
  alias: 'forms';
});
```

### Vue Version Support

The main v2 version supports Vue 3.x only, for previous versions of Vue, check the following the table

| Vue Version | vue-formily version |
| ----------- | ------------------- |
| `2.x`       | `1.x` |
| `3.x`       | `2.x` |


## Basic Usage
Let's start with a simple login form:

### Defining Form Schema
`vue-formily` need a form schema to work with, so let's define one:

```js
const loginForm = {
  formId: "login",
  fields: [
    {
      formId: "email",
      type: "string",
      rules: [
        {
          ...required,
          message: "Please enter email address.",
        },
        {
          ...email,
          message: "Please enter valid email address.",
        },
      ],
      props: {
        label: "email",
        inputType: "email"
      },
    },
    {
      formId: "password",
      type: "string",
      rules: [
        {
          ...required,
          message: "Please enter password.",
        },
      ],
      props: {
        label: "password",
        inputType: "password"
      },
    },
  ],
};
```

### Create New Form
Then we call [`$formily.add`](https://vue-formily.netlify.app/api/extension#addform) to create new form element and injects it to Vue instance's `forms` object.

```html
<template>
  <form class="login">
    <div v-for="(field, i) in forms.login.fields" :key="i" class="field">
      <label :for="field._uid">{{ field.label }}</label>
      <input v-model="field.raw" :type="field.props.inputType" :name="field.name" :id="field._uid" />
    </div>
  </form>
</template>

<script>
export default {
  created() {
    // Create new form element and injects it to `forms` object.
    this.$formily.add(loginForm);
  }
}
</script>
```

Here is the [live demo](https://vue-formily.netlify.app/getting%20started/basic-usage#live-demo).


## Contributing

You are welcome to contribute to this project, but before you do, please make sure you read the [Contributing Guide](.github/CONTRIBUTING.md).

## License

[MIT](./LICENSE)
