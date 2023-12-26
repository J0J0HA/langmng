# langmng

## Description

This is a vanilla JavaScript tool that allows you to easily create a multilingual website.

## Usage

1. Include the script in your HTML file:

    ```html
    <script src="langmng.js"></script>
    ```

2. Create the ``config.json`` files:
    Create a folder called `langmng` in the root of your project. Inside it, create a file called `config.json`.

    The `config.json` file should look like this:

    ```json
    {
        "paths": {
            "/example.html": "example"
        },
        "languages": {
            "en": "English",
            "de": "Deutsch"
        },
        "defaultLanguage": "en"
    }
    ```

    The `paths` property is an object that contains the paths to the HTML files that will be translated. The example above says to langmng that the translations for the path `/example.html` are located in the folder `/langmng/pages/example`. The `languages` property is an object that contains the languages that will be available in the language selector. The `defaultLanguage` property is the default language.

3. Create the translations:
    Inside the ``/langmng`` folder, create a folder called `pages`. Inside the `pages` folder, create a folder for each HTML file that you want to translate. The name of the folder should be the same as you specified in the ``config.json`` (see step 2). Inside each folder, create a file for each language that you want to translate the HTML file to. The name of the file should be the same as the language code. For example, if you want to translate the HTML file `example.html` to English and German, you should create the following files:

    ```text
    langmng
    ├── pages
    │   ├── example
    │   │   ├── en.json
    │   │   └── de.json
    ```

    The content of the files should be a list of key-value pairs in JSON format. The keys should be the langmng-IDs of the elements that you want to translate. The values should be the translations. For example, if you want to translate the following HTML file:

    ```json
    // /langmng/pages/example/en.json
    {
        "title": "Hello World!",
        "description": "This is a sample description.",
        "placeholder": "This is a placeholder text.",
        "isTextVisible": true,
        "thisAlsoWorks": "This also works!"
    }
    ```

4. Add the translations to your HTML:
    Add the `data-langmng` attribute to the elements that you want to translate. The value of the attribute should be a string specifying what to translate how. The options are presented further below. Here you see our ``example.html`` file with the translations added:

    ```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title data-langmng="translate:content=title">Document</title>

        <script src="/langmng.js"></script>
    </head>
    <body data-langmng="set:base=/langmng/;set:hideUntilTranslated=true;set:fadeIn=true;">
        <h1 data-langmng="translate:content=title;">Hello World</h1>
        <p data-langmng="translate:content=description;">This is a description</p>
        <p data-langmng="visibility=isTextVisible">Only visible in en</p>
        <input type="text" data-langmng="translate:attr.placeholder=placeholder;" placeholder="This is a placeholder"><br>
        <span data-langmng="placeFeature=languageSelect;">Select Language</span><br><br>
        <span data-langmng="translate:content=nonexistant">This has no translation</span>
        <input type="text" data-langmng="translate:attr.placeholder=someKey;" placeholder="This neither">
        <br>
        <br>
        <div>@langmng:thisAlsoWorks</div>
        <input type="text" placeholder="@langmng:butThisWont">
    </body>
    </html>
    ```

## The translation options

### translate:content

This option translates the content of the element. The value of the option should be the langmng-ID of the translation. For example, if you want to translate the content of a paragraph to the translation with the langmng-ID `description`, you should add the following attribute to the paragraph: `data-langmng="translate:content=description;"`.

### translate:attr.*

This option translates the value of an attribute. The value of the option should be the langmng-ID of the translation. The name of the attribute should be specified after the `translate:attr.` part. For example, if you want to translate the placeholder of an input to the translation with the langmng-ID `placeholder`, you should add the following attribute to the input: `data-langmng="translate:attr.placeholder=placeholder;"`.

### visibility

This option sets the visibility of the element. The value of the option should be the langmng-ID of the translation. If the translation is a boolean, the element will be visible if the translation is `true` and invisible if the translation is `false`. If the translation is not a boolean, the element will be visible if the translation is not empty and invisible if the translation is empty. For example, if you want to set the visibility of a paragraph to the translation with the langmng-ID `isTextVisible`, you should add the following attribute to the paragraph: `data-langmng="visibility=isTextVisible;"`.

## Special features

### placeFeature=languageSelect

This feature places a language selector in the element. The value of the option should be the langmng-ID of the translation. The language selector will be placed in the element. For example, if you want to place a language selector in a paragraph, you should add the following attribute to the paragraph: `data-langmng="placeFeature=languageSelect;"`.

### set:*

This feature can set a page-wide setting for langmng if applied to the body element. The value of the option should be the name of the setting. The following settings are available:

### set:base

This setting specifies the base path to the translations. The value of the setting should be a string. For example, if you want to set the base path to `/langs/` (instead of ``/langmng/``), you should add the following attribute to the body: `data-langmng="set:base=/langs/;"`.

### set:hideUntilTranslated

This setting specifies if the page should be hidden until all translations are loaded. The value of the setting should be a boolean. For example, if you want to hide the page until all translations are loaded, you should add the following attribute to the body: `data-langmng="set:hideUntilTranslated=true;"`. Default: `false`.

> [!IMPORTANT]  
> This will overwrite the `display` property of the body element to ``block``.

### set:fadeIn

This setting specifies if the page should fade in when all translations are loaded. Only applies if `set:hideUntilTranslated` is ``true``. The value of the setting should be a boolean. For example, if you want to fade in the page when all translations are loaded, you should add the following attribute to the body: `data-langmng="set:fadeIn=true;"`. Default: `false`.

## Direct HTML translations with @langmng

Elements with the content of `@langmng:langmngID` will be replaced with the translation of the langmngID. For example, if you want to replace the content of a div with the translation of the langmngID `thisAlsoWorks`, you should add the following element to the div: `<div>@langmng:thisAlsoWorks</div>`. This currently only works for the content of elements.
