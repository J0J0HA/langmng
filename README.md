# langmng

## Description

This is a vanilla JavaScript tool that allows you to easily create a multilingual website.

## Usage

1. Include the script in your HTML file:

    ```html
    <script src="https://j0j0ha.github.io/langmng/langmng.js"></script>
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
        "notFound": "notFound",
        "defaultLanguage": "en",
        "fallbackLanguage": "en",
        "translationVersion": 1
    }
    ```

    The `paths` property is an object that contains the paths to the HTML files that will be translated. The example above says to langmng that the translations for the path `/example.html` are located in the folder `/langmng/pages/example`. The `languages` property is an object that contains the languages that will be available in the language selector. The `defaultLanguage` property is the default language.
    The ``notFound`` property states the pageId of the 404 page. If not specified, the default is ``unknown``.

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
        <p data-langmng="@description">This is a description</p>
        <p data-langmng="visibility=isTextVisible">Only visible in en</p>
        <input type="text" data-langmng="translate:attr.placeholder=placeholder;" placeholder="This is a placeholder"><br>
        <span data-langmng="placeFeature=languageSelect;">Select Language</span><br><br>
        <span data-langmng="translate:content=nonexistant">This has no translation</span>
        <input type="text" data-langmng="translate:attr.placeholder=someKey;" placeholder="This neither">
        <br>
        <br>
        <div>@langmng:thisAlsoWorks</div>
        <input type="text" placeholder="@langmng:butThisWont">
        <a href="/example.html?lang=de" data-langmng="preload=@example;">Deutsch</a>
    </body>
    </html>
    ```

## What is ``translationVersion`` in ``config.json``?

The ``translationVersion`` property in ``config.json`` is used to invalidate the cache of the translations. If you change the value of the property, the cache will be invalidated and the translations will be reloaded. This is useful if you change the translations but the user still sees the old translations because they are cached. YOu should not use the same identifier twiche (like switching between 0 and 1), maybe use commit hashes or timestamps instead. Until the new translations are loaded, the user will still see the old translations.

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

This features can set page-wide settings for langmng if applied to the body element (except `set:content`). The value of the option should be the name of the setting. The following settings are available:

#### set:base

This setting specifies the base path to the translations. The value of the setting should be a string. For example, if you want to set the base path to `/langs/` (instead of ``/langmng/``), you should add the following attribute to the body: `data-langmng="set:base=/langs/;"`.

#### set:hideUntilTranslated

This setting specifies if the page should be hidden until all translations are loaded. The value of the setting should be a boolean. For example, if you want to hide the page until all translations are loaded, you should add the following attribute to the body: `data-langmng="set:hideUntilTranslated=true;"`. Default: `false`.

> [!IMPORTANT]  
> This will overwrite the `display` property of the body element to ``block``.

#### set:fadeIn

This setting specifies if the page should fade in when all translations are loaded. Only applies if `set:hideUntilTranslated` is ``true``. The value of the setting should be a boolean. For example, if you want to fade in the page when all translations are loaded, you should add the following attribute to the body: `data-langmng="set:fadeIn=true;"`. Default: `false`.

#### set:pageId

This setting specifies the page ID. The value of the setting should be a string. For example, if you want to set the page ID to `example`, you should add the following attribute to the body: `data-langmng="set:pageId=example;"`. Default is retrieved under `config.json`->``pages``. If that is not availible, the default is ``unknown``, or ``notFound`` in ``config.json`` if specified.

#### set:defaultLanguage

This overrides the ``defaultLanguage`` defined in ``config.json``.

#### set:fallbackLanguage

This overrides the ``fallbackLanguage`` defined in ``config.json``.

### set:content

This feature sets the content of the element. The value of the option should be valid HTML. For example, if you want to set the content of a paragraph to ``hello``, you should add the following attribute to the paragraph: `data-langmng="set:content=hello;"`. (Used internally to place error messages)

### preload

This feature preloads the translation of another page. The value should be the link to the other page, relative or absolute. For example, if you want to preload the translations of the page `example.html`, you should add the following attribute to the element: `data-langmng="preload=example.html;"`.
You can also use already existing attribute values with ``>``. For example, if you want to preload the translations of the page specified in the ``href`` attribute of a link, you should add the following attribute to the element: `data-langmng="preload=>href;"`.
If you want to preload the translations of a specific page, you can use the ``@<pageId>`` syntax. For example, if you want to preload the translations of the page `example.html`, you should add the following attribute to the element: `data-langmng="preload=@example;"`.

This feature also takes the ``lang`` query parameter into account. For example, if you want to preload the translations of the page `example.html` in the language `de`, you should add the following attribute to the element: `data-langmng="preload=example.html?lang=de;"`.

## Direct HTML translations with @langmng

Elements with the content of `@langmng:langmngID` will be replaced with the translation of the langmngID. For example, if you want to replace the content of a div with the translation of the langmngID `thisAlsoWorks`, you should add the following element to the div: `<div>@langmng:thisAlsoWorks</div>`. This currently only works for the content of elements.

## Seperating the translations from the HTML

If you want, you can use the `@`-feature to clean up your HTML. The `@`-feature allows you to seperate the translations from the HTML. To use it, you have to create a file called `<pageId>.json` in the `langmng/pages` folder for every page. The content of the file should be a list of key-value pairs in JSON format. The keys represent a unique identifier, the values should be what you would normally write in the `data-langmng`. Then, in the elements ``data-langmng``, you just write `@<identifier>` with the unique identifier specified earlier. In the example above, the descripton uses that feature. The `example.json` file looks like this:

```json
{
    "description": "translate:content=description;"
}
```

This enables us to do this in the HTML:

```html
<p data-langmng="@description">This is a description</p>
```

## View the example page

You can view the example page [here](https://j0j0ha.github.io/langmng/example.html).

## JavaScript API

### Disabling autimatic initialization

If you want to disable the automatic initialization, you can add the ``data-langmng-noinit`` attribute to the ``<body>`` tag. For example:

```html
<body data-langmng-noinit>
```

### ``async langmng.getTranslation(key, [useFallbackLanguage = true], [fallback])``

Returns the translation of the specified key in the currently selected language. If the translation is not availible, it returns the translation in the fallback language, if ``useFallbackLanguage`` is ``true``. If the translation is not availible in the fallback language or ``useFallbackLanguage`` is ``false``, it returns the fallback. If the fallback is not specified, it returns the key in this format: ``<pageId>.<language>.<key>``.

### ``async langmng.getTranslationIn(language, key, [useFallbackLanguage = true], [fallback])``

Exactly the same as ``langmng.getTranslation``, but you can specify the language.

### ``async langmng.getLanguage()``

Returns the currently selected language.

### ``async langmng.setLanguage(language)``

Sets the currently selected language to the specified language. This also updates all translations.

### ``async langmng.getConfig()``

Returns an dict of all the config values loaded from ``config.json``, the body's ``data-langmng`` and ``pages/<pageId>.json``.
You can find all availible languages under ``(await langmng.getConfig()).config.languages``.

### ``async langmng.reloadAllTranslations()``

Refreshes the translations of the current page in all available languages.

### ``async langmng.reloadTranslationsIfOutdated(language)``

Refreshes the translations of the current page in the specified language if the translation version is outdated.

### ``async langmng.preloadAllTranslations()``

Loads all not yet cached translations of the current page in all available languages.

### ``async langmng.storeCache()``

Stores the cache in the local storage.

### ``async langmng.loadCache()``

Loads the cache from the local storage.

### ``async langmng.loadConfig()``

Loads the config from ``config.json``.

### ``async langmng.getTranslations()``

Returns an dict of all the translations in all languages loaded from ``pages/<pageId>/<language>.json``.

### ``async langmng.placeLanguageSelector(element)``

Places a language selector in the specified element.

### ``async langmng.preloadTranslationsForPage(pageId)``

Loads all not yet cached translations of the specified page in all available languages.

### ``async langmng.preloadTranslationsForLink(link)``

Loads all not yet cached translations of the page found under the specified link in all available languages. The link can be relative or absolute.

### More

You can find more functions in the source code. I have just not documented them yet.

## The query parameter ``lang``

If a link is accessed with the query parameter ``lang``, the language will be set to the specified language. For example, if you access the link ``example.html?lang=de``, the language will be set to ``de``. If the specified language is not availible, the language will be set to the last language that was selected, otherwise the ``defaultLanguage``. Also, if the specified language is not availible, the query parameter will be removed from the URL.

If the parameter is present in the link, changes to the language will not be reflected in the URL.

## Customization

You can customize the look of the language selector by changing the look of the ``lanmng-language-selector`` and ``langmng-language-selector-container`` class in CSS.

## ``incluse``-Feature

If you have an element containing Text as well as other elements, you can use the ``include``-feature to include the elements in the translation. For example, if you have the following HTML:

```html
<p>
    Hi, <a href="/">ho</a>
</p>
```

You can use the ``include``-feature to include the ``a``-tag in the translation. For example:

```html
<p data-langmng="translate:content=hi;">Hi, <a href="/" data-langmng="translate:content=ho;" data-langmng-name="HO">ho</a></p>
```

Now, in the translation, you can use ``{<include-name>}`` to include the ``a``-tag in the translation. For example:

```json
{
    "hi": "Hi, {HO}",
    "ho": "ho"
}
```
