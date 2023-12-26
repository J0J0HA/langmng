window.langmng = (function () {
    const langmng = {};
    langmng.configBase = "/langmng/";
    langmng.config = {};
    langmng.pageConfig = {};
    langmng.bodyConfig = {};
    langmng.cachedTranslations = {};
    langmng._groupDirectives = async function (directives) {
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
    langmng.parseData = async function (data) {
        if (data.startsWith("@")) {
            const langmngId = data.substring(1);
            return await langmng.parseData(langmng.pageConfig[langmngId] || "set:content=@" + langmng.getEmergencyTranslation(await langmng.getPageId(), langmng.config.defaultLanguage, "content", langmngId));
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
        return this._groupDirectives(dataAsJson);
    }
    langmng.getDataFromElement = async function (element) {
        let data = element.getAttribute("data-langmng");
        if (!data) {
            return {};
        }
        const dataAsJson = await langmng.parseData(data);
        return dataAsJson;
    }
    langmng.loadBodyConfig = async function () {
        const bodyData = await langmng.getDataFromElement(document.body);
        langmng.configBase = langmng.bodyConfig?.set?.base || langmng.configBase;
        langmng.bodyConfig = bodyData;
    }
    langmng.getConfigPath = async function (path) {
        return langmng.configBase + path;
    }
    langmng.loadConfig = async function () {
        try {
            const response = await fetch(await langmng.getConfigPath("config.json"));
            const responseAsJson = await response.json();
            langmng.config = responseAsJson;
        }
        catch (e) {
            langmng.config = { defaultLanguage: "Unknown", languages: { "Unknown": "Failed to load languages." }, paths: {} };
            console.error("Could not load config.json");
        }

        const pageId = await langmng.getPageId();
        const pageConfigPath = await langmng.getConfigPath(`pages/${pageId}.json`);
        try {
            const responsePageConfig = await fetch(pageConfigPath);
            const responsePageConfigAsJson = await responsePageConfig.json();
            langmng.pageConfig = responsePageConfigAsJson;
        } catch (e) {
            langmng.pageConfig = {};
            console.warn(`Could not load page config from ${pageConfigPath}`);
        }
    };
    langmng.getPageId = async function () {
        const bodyData = await langmng.getDataFromElement(document.body);
        const path = window.location.pathname;
        const pageId = langmng.config.paths[path];
        return bodyData?.set?.pageId || pageId || "unknown";
    }
    langmng.loadTranslations = async function (language, page) {
        if (langmng.cachedTranslations?.[language]?.[page]) {
            return langmng.cachedTranslations[language][page];
        }
        try {
            const response = await fetch(await langmng.getConfigPath(`pages/${page}/${language}.json`));
            const responseAsJson = await response.json();
            langmng.cachedTranslations[language] = langmng.cachedTranslations[language] || {};
            langmng.cachedTranslations[language][page] = responseAsJson;
            return responseAsJson;
        } catch (e) {
            console.error(`Could not load translation for page ${page} and language ${language}`);
            return {};
        }
    }
    langmng.getPageConfig = async function () {
        const pageId = await langmng.getPageId();
        return {
            languages: langmng.config.languages,
            pageId: pageId,
            loadTranslations: async function (language) {
                return await langmng.loadTranslations(language, pageId);
            }
        };
    }
    langmng.getEmergencyTranslation = function (pageId, language, key, value) {
        console.warn(`No translation found for key: ${key}, value: ${value}`);
        const combinedKey = pageId + "." + language + "." + value;
        if (key == "content") {
            return combinedKey;
        } else if (key.startsWith("attr.")) {
            return combinedKey;
        } else {
            return key + "=" + combinedKey;
        }
    }
    langmng.translate = async function (language) {
        const pageConfig = await langmng.getPageConfig();
        const pageId = pageConfig.pageId;
        const translations = await pageConfig.loadTranslations(language);
        const elements = document.querySelectorAll("[data-langmng]");
        for (const element of elements) {
            const data = await langmng.getDataFromElement(element);
            if (data.translate) {
                for (let [key, value] of Object.entries(data.translate)) {
                    if (key == "content") {
                        element.innerHTML = translations[value] || langmng.getEmergencyTranslation(pageId, language, "content", value);
                    }
                    else if (key.startsWith("attr.")) {
                        element.setAttribute(key.substring(5), translations[value] || langmng.getEmergencyTranslation(pageId, language, key, value));
                    }
                }
            }
            if (data.visibility) {
                if (!translations[data.visibility]) {
                    langmng.storeStyle(element);
                    element.style.display = "none";
                } else if (element.hasAttribute("langmng-previous-display")) {
                    langmng.restoreStyle(element);
                } else {
                    element.style.display = "";
                }
            }
            for (const [key, value] of Object.entries(data)) {
                if (key == "translate" || key == "visibility") {
                    continue;
                }
                if (key.startsWith("placeFeature")) {
                    if (value == "languageSelect") {
                        const select = document.createElement("select");
                        select.innerHTML = "";
                        for (const [languageId, languageName] of Object.entries(pageConfig.languages)) {
                            const option = document.createElement("option");
                            option.value = languageId;
                            option.innerHTML = languageName;
                            select.appendChild(option);
                        }
                        select.value = language;
                        select.addEventListener("change", () => { langmng.translate(select.value); });
                        element.innerHTML = "";
                        element.appendChild(select);
                    } else {
                        console.error(`Unknown use directive: ${value}`);
                    }
                } else if (key.startsWith("set")) {
                    if (value.content) {
                        element.innerHTML = value.content;
                    } else if (value.fadeIn || value.hideUntilTranslated || value.base || value.pageId) {
                        continue;
                    } else {
                        console.error(`Unknown set directive: ${key}`);
                    }
                } else {
                    console.error(`Unknown directive: ${key}`);
                }
            }
        }
    }
    langmng.storeStyle = function (element) {
        element.setAttribute("data-langmng-previous-style", JSON.stringify(element.style));
    }
    langmng.restoreStyle = function (element) {
        element.style = JSON.parse(element.getAttribute("data-langmng-previous-style"));
    }
    langmng.readDirectivesFromElements = async function () {
        for (let element of document.querySelectorAll("*")) {
            let dirs = element.getAttribute("data-langmng") || "";
            if (element.innerHTML.startsWith("@langmng:")) {
                dirs += ";translate:content=" + element.innerHTML.substring(9);
                element.innerHTML = "";
            }
            element.setAttribute("data-langmng", dirs);
        }
    }
    langmng.initialize = async function () {
        await langmng.loadBodyConfig();
        if (langmng.bodyConfig?.set?.hideUntilTranslated === "true") {
            document.body.style.display = "block";
            langmng.storeStyle(document.body);
            document.body.style.opacity = "0";
            if (langmng.bodyConfig?.set?.fadeIn === "true") {
                setTimeout(() => {
                    document.body.style.transition = "opacity 0.5s ease-in-out";
                }, 0);
            }
        }
        await langmng.loadConfig();
        await langmng.readDirectivesFromElements();
        await langmng.translate(langmng.getDataFromElement(document.body)["default-language"] || langmng.config.defaultLanguage);
        if (langmng.bodyConfig?.set?.hideUntilTranslated === "true") {
            document.body.style.opacity = "1";
            setTimeout(() => {
                langmng.restoreStyle(document.body);
            }, 500);
        }
    };
    document.addEventListener("DOMContentLoaded", () => {
        langmng.initialize();
    });

    return langmng;
})();
