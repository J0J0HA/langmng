window.langmng = (function () {
    const langmng = {};
    let config = {};
    let pageConfig = {};
    let bodyConfig = {};
    let cachedTranslations = {};
    let lastTranslatedIn = null;
    langmng.groupLangmngTags = async function (directives) {
        const groupedDirectives = {};
        for (const [key, value] of Object.entries(directives)) {
            const [group, name] = key.split(":");
            if (!name) {
                groupedDirectives[key] = value;
                continue;
            }
            if (!groupedDirectives[group]) {
                groupedDirectives[group] = {};
            }
            groupedDirectives[group][name] = value;
        }
        return groupedDirectives;
    }
    langmng.parseLangmngTags = async function (data) {
        if (data.startsWith("@")) {
            const langmngId = data.substring(1);
            return await langmng.parseLangmngTags(pageConfig[langmngId] || "set:content=@" + await langmng.getTranslationReplacement(await langmng.getPageId(), config.defaultLanguage, "content", langmngId));
        }
        const directives = data.split(";");
        const dataAsJson = {};
        for (const directive of directives) {
            if (directive.length === 0) {
                continue;
            }
            const [key, value] = directive.split("=");
            dataAsJson[key] = value;
        }
        return this.groupLangmngTags(dataAsJson);
    }
    langmng.getLangmngTagsAsDictFromElement = async function (element) {
        let data = element.getAttribute("data-langmng");
        if (!data) {
            return {};
        }
        const dataAsJson = await langmng.parseLangmngTags(data);
        return dataAsJson;
    }
    langmng.loadBodyConfig = async function () {
        const bodyData = await langmng.getLangmngTagsAsDictFromElement(document.body);
        bodyConfig = bodyData;
    }
    langmng.getPathTo = async function (path) {
        return (bodyConfig?.set?.base || "/langmng/") + path;
    }
    langmng.loadConfig = async function () {
        try {
            const response = await fetch(await langmng.getPathTo("config.json"));
            const responseAsJson = await response.json();
            config = responseAsJson;
        }
        catch (e) {
            config = { defaultLanguage: "Unknown", languages: { "Unknown": "Failed to load languages." }, paths: {} };
            console.error("Could not load config.json");
        }

        const pageId = await langmng.getPageId();
        const pageConfigPath = await langmng.getPathTo(`pages/${pageId}.json`);
        try {
            const responsePageConfig = await fetch(pageConfigPath);
            const responsePageConfigAsJson = await responsePageConfig.json();
            pageConfig = responsePageConfigAsJson;
        } catch (e) {
            pageConfig = {};
            console.info(`Could not load page config from ${pageConfigPath}`);
        }
    };
    langmng.getPageId = async function (path = undefined) {
        const bodyData = await langmng.getLangmngTagsAsDictFromElement(document.body);
        path = path === undefined ? window.location.pathname : path;
        const pageId = config.paths[path];
        return bodyData?.set?.pageId || pageId || config.notFoundPage || "unknown";
    }
    langmng.getTranslations = async function (language = undefined, allowCache = true, pageId = undefined) {
        language = language === undefined ? await langmng.getLanguage() : language;
        pageId = pageId === undefined ? await langmng.getPageId() : pageId;
        if (allowCache && cachedTranslations?.[language]?.[pageId]) {
            return cachedTranslations[language][pageId];
        }
        try {
            const response = await fetch(await langmng.getPathTo(`pages/${pageId}/${language}.json`));
            const responseAsJson = await response.json();
            cachedTranslations[language] = cachedTranslations[language] || {};
            cachedTranslations[language][pageId] = responseAsJson;
            return responseAsJson;
        } catch (e) {
            console.error(`Could not load translation for page ${pageId} and language ${language}`, e);
            return {};
        }
    }
    langmng.getConfig = async function () {
        return {
            config: config,
            pageConfig: pageConfig,
            bodyConfig: bodyConfig
        };
    }
    langmng.getPage = async function () {
        const pageId = await langmng.getPageId();
        return {
            languages: config.languages,
            pageId: pageId,
            getTranslations: async function (language) {
                return await langmng.getTranslations(language);
            }
        };
    }
    langmng.getTranslationReplacement = async function (pageId, language, value) {
        const combinedKey = pageId + "." + language + "." + value;
        return combinedKey;
    }
    langmng.getTranslationIn = async function (language, value, useFallbackLanguage = true, fallback = undefined) {
        const fallbackLanguage = bodyConfig.set?.fallbackLanguage || config.fallbackLanguage;
        const pageConfig = await langmng.getPage();
        const pageId = pageConfig.pageId;
        const translations = await pageConfig.getTranslations(language);
        if (translations[value] === undefined) {
            console.warn(`No translation found for key: ${value} (language: ${language})`);
            if (language !== fallbackLanguage && useFallbackLanguage) {
                console.log(`Trying fallback language: ${fallbackLanguage}`)
                return await langmng.getTranslationIn(fallbackLanguage, value, false, fallback === undefined ? await langmng.getTranslationReplacement(pageId, language, value) : fallback);
            } else if (fallback !== undefined) {
                return fallback;
            }
            return await langmng.getTranslationReplacement(pageId, language, value);
        }
        return translations[value];
    }
    langmng.getTranslation = async function (key, useFallbackLanguage = true, fallback = undefined) {
        const language = await langmng.getLanguage();
        return await langmng.getTranslationIn(language, key, useFallbackLanguage, fallback);
    }
    langmng.placeLanguageSelector = async function (element) {
        const select = document.createElement("select");
        select.innerHTML = "";
        for (const [languageId, languageName] of Object.entries((await langmng.getPage()).languages)) {
            const option = document.createElement("option");
            option.value = languageId;
            option.innerHTML = languageName;
            select.appendChild(option);
        }
        select.value = await langmng.getLanguage();
        select.classList.add("langmng-selector");
        select.addEventListener("change", () => { langmng.setLanguage(select.value); });
        element.innerHTML = "";
        element.classList.add("langmng-selector-container");
        element.appendChild(select);
    }
    langmng.translateElement = async function (element) {
        const data = await langmng.getLangmngTagsAsDictFromElement(element);
        if (data.translate) {
            for (let [key, value] of Object.entries(data.translate)) {
                if (key == "content") {
                    let translatedText = await langmng.getTranslation(value);
                    element.querySelectorAll(":scope > [data-langmng-include]").forEach((e) => {
                        translatedText = translatedText.replace("{" + e.getAttribute("data-langmng-include") + "}", e.outerHTML);
                    });
                    element.innerHTML = translatedText;
                    for (let el of element.querySelectorAll(":scope > [data-langmng]")) {
                        await langmng.translateElement(el);
                    }
                }
                else if (key.startsWith("attr.")) {
                    const translatedText = await langmng.getTranslation(value)
                    element.setAttribute(key.substring(5), translatedText);
                }
            }
        }
        for (const [key, value] of Object.entries(data)) {
            if (key == "translate" || key == "include") {
                continue;
            }
            if (key == "visibility") {
                if (!(await langmng.getTranslation(value, false, false))) {
                    langmng.storeStyle(element);
                    element.style.display = "none";
                } else if (element.hasAttribute("langmng-previous-display")) {
                    langmng.restoreStyle(element);
                } else {
                    element.style.display = "";
                }
            } else if (key == "preload") {
                if (value.startsWith(">")) {
                    langmng.preloadTranslationsForLink(element.getAttribute(value.substring(1)));
                } else if (value.startsWith("@")) {
                    langmng.preloadTranslationsForPage(value.substring(1));
                } else {
                    langmng.preloadTranslationsForLink(value);
                }
            } else if (key.startsWith("placeFeature")) {
                if (value == "languageSelect") {
                    langmng.placeLanguageSelector(element);
                } else {
                    console.warn(`Unknown use directive: ${value}`);
                }
            } else if (key.startsWith("set")) {
                if (value.content) {
                    element.innerHTML = value.content;
                } else if (value.fadeIn || value.hideUntilTranslated || value.base || value.pageId) {
                    continue;
                } else {
                    console.warn(`Unknown set directive: ${key}`);
                }
            } else {
                console.warn(`Unknown directive: ${key}`);
            }
        }
        return true;
    }
    langmng.translatePage = async function () {
        await langmng.getTranslations();
        const htmlElement = document.querySelector("html");
        htmlElement.setAttribute("lang", await langmng.getLanguage());
        const elements = document.querySelectorAll("[data-langmng]");
        let promiseList = [];
        for (const element of elements) {
            promiseList.push(langmng.translateElement(element));
        }
        lastTranslatedIn = await langmng.getLanguage();
        return await Promise.all(promiseList);
    }
    langmng.storeStyle = function (element) {
        element.setAttribute("data-langmng-old-style", element.getAttribute("style"));
    }
    langmng.restoreStyle = function (element) {
        element.setAttribute("style", element.getAttribute("data-langmng-old-style"));
        element.removeAttribute("data-langmng-old-style");
    }
    langmng.transformAtSyntaxToLangmngTags = async function () {
        for (let element of document.querySelectorAll("*")) {
            let dirs = element.getAttribute("data-langmng") || "";
            if (element.innerHTML.startsWith("@langmng:")) {
                dirs += ";translate:content=" + element.innerHTML.substring(9);
                element.innerHTML = "";
            }
            element.setAttribute("data-langmng", dirs);
        }
    }
    langmng.loadCache = async function () {
        const cachedTranslationsFromLStore = localStorage.getItem("langmng.cachedTranslations");
        if (cachedTranslationsFromLStore) {
            cachedTranslations = JSON.parse(cachedTranslationsFromLStore);
        }
    }
    langmng.storeCache = async function () {
        localStorage.setItem("langmng.cachedTranslations", JSON.stringify(cachedTranslations));
    }
    langmng.preloadAllTranslations = async function (allowCache = true) {
        const languages = config.languages;
        for (const language of Object.keys(languages)) {
            await langmng.getTranslations(language, allowCache);
        }
        await langmng.storeCache();
    }
    langmng.reloadAllTranslations = async function () {
        await langmng.preloadAllTranslations(false);
    }
    langmng.reloadAllTranslationsIfOutdated = async function () {
        const currentUsedVersion = localStorage.getItem("langmng.translationVersion");
        if (currentUsedVersion != config.translationVersion) {
            await langmng.reloadAllTranslations();
            localStorage.setItem("langmng.translationVersion", config.translationVersion);
        }
    }
    langmng.getLanguage = async function () {
        let url = new URL(window.location.href);
        let urlLanguage = url.searchParams.get("lang");
        if (Object.keys(config.languages).indexOf(urlLanguage) == -1) {
            urlLanguage = null;
            url.searchParams.delete("lang");
            window.history.replaceState({}, document.title, url.href);
        }
        let lastLanguage = localStorage.getItem("langmng.language");
        if (Object.keys(config.languages).indexOf(lastLanguage) == -1) {
            lastLanguage = null;
        }
        return urlLanguage || lastLanguage || bodyConfig.set?.defaultLanguage || config.defaultLanguage;
    }
    langmng.preloadTranslationsForPage = async function (pageId, language) {
        language = language === undefined ? await langmng.getLanguage() : language;
        console.log(`Preloading translations for page ${pageId} and language ${language}`);
        return await langmng.getTranslations(language, true, pageId);
    }
    langmng.preloadTranslationsForLink = async function (link, language) {
        language = language === undefined ? await langmng.getLanguage() : language;
        const url = new URL(link, document.baseURI);
        if (url.searchParams.get("lang") !== null) {
            language = url.searchParams.get("lang");
        }
        const pageId = await langmng.getPageId(url.pathname);
        return await langmng.preloadTranslationsForPage(pageId, language);
    }
    langmng.setLanguage = async function (language) {
        const url = new URL(window.location.href);
        if (url.searchParams.get("lang") !== null && url.searchParams.get("lang") !== language) {
            url.searchParams.set("lang", language);
            window.history.replaceState({}, document.title, url.href);
        }
        localStorage.setItem("langmng.language", language);
        if (lastTranslatedIn != language) {
        return await langmng.translatePage(language);
        }
        return true;
    }
    langmng.initialize = async function () {
        await langmng.loadBodyConfig();
        if (bodyConfig?.set?.hideUntilTranslated === "true") {
            document.body.style.display = "block";
            langmng.storeStyle(document.body);
            document.body.style.opacity = "0";
            if (bodyConfig?.set?.fadeIn === "true") {
                setTimeout(() => {
                    document.body.style.transition = "opacity 0.5s ease-in-out";
                }, 0);
            }
        }
        await langmng.loadCache();
        await langmng.loadConfig();
        await langmng.transformAtSyntaxToLangmngTags();
        const language = await langmng.getLanguage();
        await langmng.setLanguage(language);
        if (bodyConfig?.set?.hideUntilTranslated === "true") {
            document.body.style.opacity = "1";
            setTimeout(() => {
                langmng.restoreStyle(document.body);
            }, 500);
        }
        await langmng.reloadAllTranslationsIfOutdated();
        await langmng.translatePage();
    };

    document.addEventListener("DOMContentLoaded", () => {
        if (document.body.getAttribute("data-langmng-noinit") === null) {
            langmng.initialize();
        }
    });

    const proxiedLangmng = new Proxy(langmng, {
        get: function (target, name) {
            return target[name];
        },
        set: function (target, name, value) {
            console.error("langmng is read-only");
            return false;
        }
    });

    return proxiedLangmng;
})()
