// ==UserScript==
// @name         Poe trade finer-search-options
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  enables finer search options in Path of exile official trade site, allowing filtering in/out mods directly from the current search result list
// @author       Maxime B, Taldor
// @match        https://www.pathofexile.com/trade
// @match        https://www.pathofexile.com/trade/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @license      MIT
// @grant        none
// ==/UserScript==

(function($) {
    'use strict';

    //---------HTML---------//
    const scriptStyle=$(`
        <style>
            .finer-add-filter{ background: rgba(2,  93, 34, 0.75); }
            .finer-remove-filter{ background: rgba(93, 2,  2,  0.75); }
            .finer-filter-buttons{ left: auto; }
            .finer-filterable:hover { background: rgba(255, 255, 255, 0.2); }
            .finer-filtered{ background-color: rgba(0, 136, 0, .25); }
            .btn-finer-search { padding: 0 10px;    line-height: 1;    color: white;    outline: solid 1px grey;}
            .hand{ cursor: pointer; }
            .finer-search-global-toggle-collapsed { position: absolute;    right: 5px;    top: 5px;    width: 15px;    height: 15px;    background: rgb(56, 35, 4);    cursor:pointer; }
            .upArr::before{ content:"\\25BE";    position: absolute;    font-size: 25px;    top: -10px;    left: -3px; }
            .dnArr::before{ content:"\\25B8";    position: absolute;    font-size: 25px;    top: -10px;    left: -3px; }
            #finer-search-global{ display: none;    color: #fff;    height: max-content;    width: 12em;    background: rgba(0, 0, 0, 0.75);    position: fixed;    right: 10px;    top: 50px;    z-index: 1001;    font-size:130%;    user-select:none; }
            body:has(#trade .livesearch-btn) #finer-search-global{ display: block; }
            #finer-search-global .hidden{ display: none; }
            #finer-search-global-title{ outline: 1px solid rgb(138, 86, 9);    background-color: rgb(90, 56, 6);    width: inherit;    display: block;    text-align: center;    text-transform: capitalize;    font-size: 115%;    cursor: move; }
            .finer-global-btn{ background: rgb(15, 48, 77);    outline: solid 1px rgb(76, 76, 125);    margin-top: 10px;    padding: 1px 1px 1px 0.3em;     display: grid;    grid-gap:3px;    grid-template-areas: "mod-name mod-minus mod-plus";    grid-template-columns: auto 1em 1em;    text-transform: capitalize; }
            .finer-global-btn-pm { height: 1em;    border: 1px inset rgba(255, 255, 255, 0.445);    align-self: center;    text-align: cell;    display: flex;    justify-content: center;    align-items: center;    color: #fff;    background-color: rgb(77, 57, 14); }
            .finer-global-btn-pm.mod-name { text-align: cell;    grid-area: mod-name; }
            .finer-global-btn-pm.plus { background: rgb(29, 139, 53);     grid-area: mod-plus; }
            .finer-global-btn-pm.minus { background: rgb(139, 28, 28);    grid-area: mod-minus; }
            .finer-global-btn-pm.plus:hover, .finer-global-btn-pm.minus:hover { filter: brightness(140%); }
            .finer-search-global-toggle-collapsed:hover { filter: brightness(80%); }
            .finer-search-global-section-title { text-align: center;    display: block; }
            .finer-search-global-section + .finer-search-global-section { margin-top: 5px; }
            .finer-search-global-section { padding-top: 5px;    position: relative; }
            .finer-search-global-section + .finer-search-global-section { border-top: solid 1px; }
        </style>
    `);
    const globalFiner = $(`

        <div id="finer-search-global">
            <span id="finer-search-global-title">add to filters</span>
            <div class="finer-search-global-toggle-collapsed dnArr"></div>
            <div class="finer-search-global-body hidden">
                <div class="finer-search-global-section mods">
                    <span class="finer-search-global-section-title">- Modifiers -</span>
                    <div class="finer-search-global-toggle-collapsed dnArr"></div>
                    <div class="finer-search-global-section-body hidden">
                        <div data-type="life,cold,fire,ligt" class="finer-global-btn">
                            <span class="mod-name">all res & life</span>
                            <span title="increase min value by 10" class="finer-global-btn-pm plus  hand">+</span>
                            <span title="decrease min value by 10" class="finer-global-btn-pm minus hand">-</span>
                        </div>
                        <div data-type="allR" class="finer-global-btn">
                            <span class="mod-name">all resistances</span>
                            <span title="increase min value by 10" class="finer-global-btn-pm plus  hand">+</span>
                            <span title="decrease min value by 10" class="finer-global-btn-pm minus hand">-</span>
                        </div>
                        <div data-type="life" class="finer-global-btn">
                            <span class="mod-name">life</span>
                            <span title="increase min value by 10" class="finer-global-btn-pm plus  hand">+</span>
                            <span title="decrease min value by 10" class="finer-global-btn-pm minus hand">-</span>
                        </div>
                        <div data-type="cold" class="finer-global-btn">
                            <span class="mod-name">cold res</span>
                            <span title="increase min value by 10" class="finer-global-btn-pm plus  hand">+</span>
                            <span title="decrease min value by 10" class="finer-global-btn-pm minus hand">-</span>
                        </div>
                        <div data-type="fire" class="finer-global-btn">
                            <span class="mod-name">fire res</span>
                            <span title="increase min value by 10" class="finer-global-btn-pm plus  hand">+</span>
                            <span title="decrease min value by 10" class="finer-global-btn-pm minus hand">-</span>
                        </div>
                        <div data-type="ligt" class="finer-global-btn">
                            <span class="mod-name">lightning res</span>
                            <span title="increase min value by 10" class="finer-global-btn-pm plus hand">+</span>
                            <span title="decrease min value by 10" class="finer-global-btn-pm minus hand">-</span>
                        </div>
                        <div data-type="move" class="finer-global-btn">
                            <span class="mod-name">movement speed</span>
                            <span title="increase min value by 10" class="finer-global-btn-pm plus hand" >+</span>
                            <span title="decrease min value by 10" class="finer-global-btn-pm minus hand" >-</span>
                        </div>
                    </div>
                </div>
                <div class="finer-search-global-section misc">
                    <span class="finer-search-global-section-title">- Miscanellous -</span>
                    <div class="finer-search-global-toggle-collapsed dnArr"></div>
                    <div class="finer-search-global-section-body hidden">
                        <div data-type="" class="finer-global-btn">
                            <span class="mod-name">set Buyout limit</span>
                            <span title="increase buyout maximum by 1" class="finer-global-btn-pm plus  hand">+</span>
                            <span title="decrease buyout maximum by 1" class="finer-global-btn-pm minus hand">-</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
     `);
    const buttonsSpan = $(`
        <span class="lc l finer-filter-buttons">
            <button type="button" class="d btn-finer-search hand finer-add-filter" title="Include this mod" aria-label="Include this mod">+</button>
            <button type="button" class="d btn-finer-search hand finer-remove-filter" title="Exclude this mod" aria-label="Exclude this mod">-</button>
        </span>
    `);

    const modMap = {
        life: 'total_life',
        cold: 'total_cold_resistance',
        fire: 'total_fire_resistance',
        ligt: 'total_lightning_resistance',
        move: 'increased_movement_speed',
        allR: 'total_elemental_resistance'
    };

    const resultMod = '.item-mod, .itemBoxContent > .content > div[class*="Mod"]';
    const searchMod = resultMod.split(', ').map(selector => `#trade .resultset ${selector}`).join(', ');
    const statId = mod => $(mod).children('[data-field^="stat."]').first().attr('data-field')?.slice(5);
    const createFilter = id => ({ id, value: {}, disabled: false });
    const hasStatFilter = (groups, id) => groups.some(group =>
        !group.disabled && group.filters.some(filter => !filter.disabled && filter.id === id)
    );
    let savingSearch = false;

    async function changeSearch(update) {
        const app = window.app;
        const button = document.querySelector('#trade button.search-btn');
        if (savingSearch || !app?.loaded || app.state.tab !== 'search' || !button || button.disabled) return;

        savingSearch = true;
        try {
            if (!update(app.$store, app.state)) return;
            // The current client compresses the query before updating browser history.
            await app.save(true);
            if (window.app === app && app.state.tab === 'search' && button.isConnected) button.click();
        } catch (error) {
            console.error('[PoE Finer Search Options] Could not update the trade search', error);
        } finally {
            savingSearch = false;
        }
    }

    // The trade app replaces its mount element's contents when it starts.
    $('body').append(scriptStyle, globalFiner);

    let $dragging = null;
    let offset = null;

    //document listeners
    $(document)
        .on('mouseenter', '#trade .resultset > .row', function(){ checkFilters(this) })
        .on('mouseenter', searchMod, function(){ addButtons(this) })
        .on('mouseleave', searchMod, function(){ $(this).children('.finer-filter-buttons').detach() })
        .on('click', '.finer-filter-buttons button', function(e){ addOrRemoveFilter(e, this) })
        //-----------step 4 : on button click in the global div, add the corresponding mods to the search
        .on('click','#finer-search-global > .finer-search-global-body > .finer-search-global-section.mods > .finer-search-global-section-body > .finer-global-btn > .finer-global-btn-pm', function(e){ addPseudoMods(e) })
        .on('click','#finer-search-global > .finer-search-global-body > .finer-search-global-section.misc > .finer-search-global-section-body > .finer-global-btn > .finer-global-btn-pm', function(e){ addCurrencyLimit(e) })
        .on('click','.finer-search-global-toggle-collapsed', function(e){ toggleFiltersVisibility(e) })
        //-----------step 5 : on click in the global div title, toggle draggable
        .on("mousedown", "#finer-search-global-title", function (e) { handleDragMouseDown(e) })
        .on("mouseup", function (e) { clearDragVars() })
        .on("mousemove", 'body', function(e) { handleDragMove(e) })

    //fix for draggable going out of viewport when resizing
    $(window)
        .on('resize', function(e){ $('#finer-search-global').offset({ right: 10, top: 50 }) })

    const clearDragVars = () => {
        $dragging = null ;
        offset = null;
    }

    const handleDragMouseDown = e =>{
        $dragging = $(e.target).parent();
        const tmpoff = $dragging.offset();
        offset = {
            maxX:$(window).width()-$dragging.width(),
            maxY:$(window).height()-$dragging.height(),
            xoff: e.pageX - tmpoff.left,
            yoff: e.pageY - tmpoff.top
        }
    }

    const handleDragMove = e =>{
        if ($dragging){
            $dragging.offset({
                top: Math.max(0,Math.min(e.pageY- offset.yoff, offset.maxY)),
                left: Math.max(0,Math.min(e.pageX- offset.xoff, offset.maxX))
            });
        }
    }

    const toggleFiltersVisibility = e => {
        const toggler = $(e.target);
        toggler.toggleClass('dnArr').toggleClass('upArr');
        toggler.parent().children('[class*="body"]')
//         .animate( {height: "toggle"}, 500, 'easeInOutQuint' )
        .toggleClass('hidden');
    };

    function updateMod(mod) {
        const app = window.app;
        const id = statId(mod);
        const groups = app?.state?.stats ?? [];
        const filtered = Boolean(id && hasStatFilter(groups, id));
        const filterable = Boolean(id && !filtered && app?.static_?.knownStatsFlat?.[id]);
        $(mod).toggleClass('finer-filtered', filtered).toggleClass('finer-filterable', filterable);
        return filterable;
    }

    function checkFilters(row) {
        $(row).find(resultMod).each((_, mod) => updateMod(mod));
    }

    function addButtons(mod) {
        if (updateMod(mod)) $(mod).append(buttonsSpan);
    }

    function addOrRemoveFilter(e, button) {
        e.preventDefault();
        e.stopPropagation();
        const mod = $(button).closest(resultMod)[0];
        if (!mod || !updateMod(mod)) return;
        const id = statId(mod);
        const type = $(button).hasClass('finer-add-filter') ? 'and' : 'not';

        return changeSearch((store, state) => {
            if (hasStatFilter(state.stats, id)) return false;
            const group = state.stats.findIndex((entry, index) => index > 0 && entry.type === type && !entry.disabled);
            if (group < 0) {
                store.commit('pushStatGroup', { type, filters: [createFilter(id)] });
            } else {
                const index = state.stats[group].filters.findIndex(filter => filter.id === id);
                if (index < 0) store.commit('setStatFilter', { group, value: createFilter(id) });
                else store.commit('setStatFilter', {
                    group, index, value: { ...state.stats[group].filters[index], disabled: false }
                });
            }
            updateMod(mod);
            $(mod).children('.finer-filter-buttons').detach();
            window.app.$refs.toastr?.Add({
                msg: type === 'and' ? 'Mod added to your stat filters.' : 'Mod added to your exclusion filters.',
                progressbar: false,
                timeout: 3000
            });
            return true;
        });
    }

    function addPseudoMods(e) {
        const ids = $(e.currentTarget).parent().data('type').split(',').map(key => `pseudo.pseudo_${modMap[key]}`);
        const more = $(e.currentTarget).hasClass('plus');

        return changeSearch((store, state) => {
            let group = state.stats.findIndex(entry => entry.type === 'and' && !entry.disabled);
            if (group < 0) {
                if (!more) return false;
                group = state.stats.length;
                store.commit('pushStatGroup', { type: 'and' });
            }

            let changed = false;
            const filters = state.stats[group].filters;
            for (const id of ids) {
                const index = filters.findIndex(filter => filter.id === id);
                if (index < 0) {
                    if (!more) continue;
                    store.commit('setStatFilter', { group, value: createFilter(id) });
                } else {
                    const filter = filters[index];
                    const min = filter.value?.min || 0;
                    if (!min && !more) store.commit('removeStatFilter', { group, index });
                    else store.commit('setStatFilter', {
                        group, index, value: { ...filter, value: { ...filter.value, min: min + (more ? 10 : -10) } }
                    });
                }
                changed = true;
            }
            return changed;
        });
    }

    function addCurrencyLimit(e) {
        const more = $(e.currentTarget).hasClass('plus');
        return changeSearch((store, state) => {
            const value = { ...state.filters.trade_filters?.filters?.price };
            if (!more && !value.max) return false;
            if (more) value.max = (value.max || 4) + 1;
            else if (value.max > 1) value.max -= 1;
            else delete value.max;
            store.commit('setPropertyFilter', { group: 'trade_filters', index: 'price', value });
            return true;
        });
    }
})(window.jQuery);
