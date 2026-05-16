// Import dependencies
import { storage } from './modules/storage.js';
import { loadCase, saveCase, exportToPDF } from './modules/fileOperations.js';
import i18n from './modules/i18n.js';

// Access jQuery from global scope (loaded via inline script)
const $ = window.jQuery || window.$;

// Global variables
window.current_file = "";
window.is_dirty = false;
window.current_tooth = {};
window.current_tooth_index = -1;
window.scores = {};
window.appdb = null;

let isScoringTabActive = false;
const appVersion = "0.1.7";
const appName = "Subadult Dental Age Estimation";

// Initialize Snackbar
const Snackbar = window.Snackbar || {};

// Initialize the app
async function init() {
  // Get settings and ensure defaults are persisted to localStorage on first run
  const settings = storage.getSettings();

  // Check if settings exist in localStorage, if not, save the defaults
  const storedSettings = localStorage.getItem('dental_ta_settings');
  if (!storedSettings) {
    // First run - save default settings to localStorage
    storage.setSettings(settings);
  }

  const savedLang = settings.language;

  // Update URL to match saved language without reloading
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (!urlLang || urlLang !== savedLang) {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', savedLang);
    window.history.replaceState({}, '', url.toString());
  }

  $("#app-version").html(appVersion);

  // Load tooth charts
  $("#tc-permanent-maxillary").load("/images/charts/permanent-maxillary.svg");
  $("#tc-permanent-mandibular").load("/images/charts/permanent-mandibular.svg");
  $("#tc-deciduous-maxillary").load("/images/charts/deciduous-maxillary.svg");
  $("#tc-deciduous-mandibular").load("/images/charts/deciduous-mandibular.svg");

  // Load database in the correct language
  await load_database(savedLang);
  reset_scores();

  // Apply saved language to i18n
  if (savedLang !== i18n.language) {
    await i18n.changeLanguage(savedLang);
  }

  show_screen('splash');
}

async function load_database(lang) {
  try {
    const response = await fetch(`/data/db.${lang}.json`);
    window.appdb = await response.json();
  } catch (error) {
    console.error('Failed to load database:', error);
  }
}

function new_case() {
  if (window.is_dirty) {
    // TODO: Confirm with user
  }
  
  window.current_file = "";
  window.is_dirty = true;
  reset_case_info();
  reset_scores();
  reset_results();
  clear_tooth_selection();
  
  display_current_file();
  show_screen('scoring');
}

async function open_case() {
  const fileInput = document.getElementById('file-input');
  fileInput.click();
  
  fileInput.onchange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const caseData = await loadCase(file);
        new_case();
        
        // Populate case info
        $("#case_number_input").val(caseData.properties.case_number);
        $("#observation_date_input").val(caseData.properties.observation_date);
        $("#analyst_input").val(caseData.properties.analyst);
        $("#memo_input").val(caseData.properties.memo);
        $("input").trigger('change');
        $("textarea").trigger('change');
        
        // Populate scores
        window.scores = caseData.scores;
        set_scored_teeth();
        
        window.current_file = file.name;
        window.is_dirty = false;
        display_current_file();
        show_screen('scoring');
        
        // Save to localStorage
        storage.setCurrentCase(caseData);
      } catch (error) {
        console.error('Failed to load case:', error);
        Snackbar.show({
          text: 'Failed to load case file',
          pos: 'bottom-center',
          showAction: false
        });
      }
    }
  };
}

async function save_case() {
  const caseData = {
    scores: window.scores,
    properties: {
      case_number: $("#case_number_input").val(),
      analyst: $("#analyst_input").val(),
      memo: $("#memo_input").val(),
      observation_date: $("#observation_date_input").val()
    }
  };
  
  await saveCase(caseData);
  
  window.is_dirty = false;
  display_current_file();
  
  // Save to localStorage
  storage.setCurrentCase(caseData);
}

function update_ui_language() {
  // Update header buttons
  $("#new-button").text(i18n.t('header.new'));
  $("#open-button").text(i18n.t('header.open'));
  $("#save-button").text(i18n.t('header.save'));
  $("#settings-button").text(i18n.t('header.settings'));

  // Update splash screen
  $("#splash-screen h1").text(i18n.t('splash.title'));
  $("#splash-screen .lead").first().text(i18n.t('splash.subtitle'));
  $(".btn-splash-new").text(i18n.t('splash.new'));
  $(".btn-splash-load").text(i18n.t('splash.open'));

  // Update tabs
  $("#tab-case-info").text(i18n.t('tabs.case'));
  $("#tab-scoring-info").text(i18n.t('tabs.scoring'));
  $("#tab-review-info").text(i18n.t('tabs.review'));
  $("#tab-results-info").text(i18n.t('tabs.results'));

  // Update case info tab
  $('label[for="case_number_input"]').text(i18n.t('caseinfo.number-label'));
  $('#case_number_input').next('.bmd-help').text(i18n.t('caseinfo.number-text'));
  $('label[for="observation_date_input"]').text(i18n.t('caseinfo.date-label'));
  $('#observation_date_input').next('.bmd-help').text(i18n.t('caseinfo.date-text'));
  $('label[for="analyst_input"]').text(i18n.t('caseinfo.analyst-label'));
  $('#analyst_input').next('.bmd-help').text(i18n.t('caseinfo.analyst-text'));
  $('label[for="memo_input"]').text(i18n.t('caseinfo.memo-label'));
  $('#memo_input').next('.bmd-help').text(i18n.t('caseinfo.memo-text'));
  $(".scoring-button").text(i18n.t('caseinfo.scoring-button'));

  // Update scoring tab
  $('.btn-tooth-chart[data-chart="permanent"]').text(i18n.t('scoring.permanent'));
  $('.btn-tooth-chart[data-chart="deciduous"]').text(i18n.t('scoring.deciduous'));
  $(".case-button").text(i18n.t('scoring.case-button'));
  $(".review-button").text(i18n.t('scoring.review-button'));
  $("#analysis-card .alert").text(i18n.t('scoring.select-tooth'));

  // Update review tab
  $("#tab-pane-review-info h3").text(i18n.t('review.title'));
  $("#scores-table thead th").eq(0).text(i18n.t('review.tooth'));
  $("#scores-table thead th").eq(1).text(i18n.t('review.set'));
  $("#scores-table thead th").eq(2).text(i18n.t('review.jaw'));
  $("#scores-table thead th").eq(3).text(i18n.t('review.side'));
  $("#scores-table thead th").eq(4).text(i18n.t('review.tooth'));
  $("#scores-table thead th").eq(5).text(i18n.t('review.score'));
  $(".reset-button").text(i18n.t('review.reset-button'));
  $(".reset-all-button").text(i18n.t('review.reset-all-button'));
  $(".analyze-button").text(i18n.t('review.analyze-button'));

  // Update results tab
  $("#tab-pane-results-info > div > div > div > h3").first().text(i18n.t('results.title'));

  // Update settings modal
  $("#settings-modal-label").text(i18n.t('settings.title'));
  $("#settings-modal h6").eq(0).text(i18n.t('settings.language.title'));
  $('label[for="settings_language_en"]').text(i18n.t('settings.language.english'));
  $('label[for="settings_language_es"]').text(i18n.t('settings.language.spanish'));
  $("#settings-modal h6").eq(1).text(i18n.t('settings.numbering.title'));
  $('label[for="settings_numbering_universal"]').text(i18n.t('settings.numbering.universal'));
  $('label[for="settings_numbering_fdi"]').text(i18n.t('settings.numbering.fdi'));
  $('label[for="settings_numbering_palmer"]').text(i18n.t('settings.numbering.palmer'));
  $('label[for="settings_numbering_field"]').text(i18n.t('settings.numbering.field'));
  $("#settings-modal h6").eq(2).text(i18n.t('settings.imgpref.title'));
  $('label[for="settings_imgpref_mfh"]').text(i18n.t('settings.imgpref.mfh'));
  $('label[for="settings_imgpref_xray"]').text(i18n.t('settings.imgpref.xray'));
  $("#settings-modal h6").eq(3).text(i18n.t('settings.autopage.title'));
  $("#settings-modal small").text(i18n.t('settings.autopage.text'));
  $('label[for="settings_autopage_true"]').text(i18n.t('settings.autopage.enable'));
  $('label[for="settings_autopage_false"]').text(i18n.t('settings.autopage.disable'));
  $("#settings-modal .modal-footer .btn-secondary").text(i18n.t('settings.cancel'));
  $("#btn-save-settings").text(i18n.t('settings.save'));

  // Update footer
  $("footer p").html(`&copy; ${new Date().getFullYear()} ${i18n.t('splash.title')}`);
}

function open_settings() {
  const settings = storage.getSettings();

  // Clear all radio buttons first
  $('input[name="settings_language"]').prop('checked', false);
  $('input[name="settings_numbering"]').prop('checked', false);
  $('input[name="settings_imgpref"]').prop('checked', false);
  $('input[name="settings_autopage"]').prop('checked', false);

  // Set language radio button
  const langValue = settings.language === 'es' ? 'es' : 'en';
  $(`#settings_language_${langValue}`).prop('checked', true);

  // Set other radio buttons based on saved settings
  $(`#settings_numbering_${settings.numbering}`).prop('checked', true);
  $(`#settings_imgpref_${settings.image_preference}`).prop('checked', true);
  $(`#settings_autopage_${String(settings.auto_page_teeth)}`).prop('checked', true);
}

async function save_settings() {
  const autopage = $("input[name='settings_autopage']:checked").val() === "true";
  const newLanguage = $("input[name='settings_language']:checked").val();
  const currentSettings = storage.getSettings();
  const languageChanged = newLanguage !== currentSettings.language;

  const settings = {
    numbering: $("input[name='settings_numbering']:checked").val(),
    image_preference: $("input[name='settings_imgpref']:checked").val(),
    auto_page_teeth: autopage,
    language: newLanguage
  };

  storage.setSettings(settings);

  update_chart_numbering(settings.numbering);
  update_scoring_images(settings.image_preference);

  $("#settings-modal").modal('hide');

  // Update language without reloading page
  if (languageChanged) {
    await i18n.changeLanguage(newLanguage);
    await load_database(newLanguage);
    //update_ui_language();

    // Update URL without reloading
    // const url = new URL(window.location.href);
    // url.searchParams.set('lang', newLanguage);
    // window.history.replaceState({}, '', url.toString());
  }
}

function reset_case_info() {
  $("#case_number_input").val("");
  $("#observation_date_input").val("");
  $("#analyst_input").val("");
  $("#memo_input").val("");
}

function reset_scores() {
  localStorage.removeItem("results");
  window.scores = {};
  populate_review();
  set_scored_teeth();
}

function reset_results() {
  $("#results-score-table tbody").empty();
  $("#results-mu").val("");
  $("#results-w").val("");
  $("#results-b").val("");
  $("#results-prediction").html("");
  $("#results-lower").html("");
  $("#results-upper").html("");
  $("#results-images").empty();
}

function show_screen(id) {
  $(".screen").hide();
  // $("header").removeClass("mb-auto").hide();
  // $("footer").hide();
  
  const screen = $(`#${id}-screen`);
  if (screen.data('header')) $("header").show();
  if (screen.data('footer')) {
    $("footer").show();
    $("header").addClass("mb-auto");
  }
  
  if (id === 'scoring') {
    show_tooth_chart(
      $(".btn-tooth-chart").first(),
      $(".btn-tooth-chart").first().data('chart'),
      $(".btn-tooth-chart").first().data('jaw')
    );
    $("#tab-case-info").tab('show');
  }
  
  screen.show();
}

function display_current_file() {
  const f = window.current_file === "" ? i18n.t('default-file-name') : window.current_file;
  $("#current-file").html(f + (window.is_dirty ? "*" : ""));
}

// Tooth scoring functions
function select_tooth(id) {
  const tooth_key = `Tooth${id}`;
  set_scored_teeth();
  
  if ($(`#${tooth_key}`).hasClass('active')) {
    clear_tooth_selection();
  } else {
    $("polygon").removeClass("active");
    $("path").removeClass("active");
    $(`#Tooth${id}`).removeClass("scored").addClass("active");
    
    const key = $(`#${tooth_key}`).data('key');
    
    window.current_tooth_index = find_tooth_index(key);
    if (window.current_tooth_index > -1) {
      const img_preference = storage.getSettings().image_preference;
      const tooth = window.appdb.teeth[window.current_tooth_index];
      window.current_tooth = tooth;
      set_tooth_paging();
      
      const jaw_i18n = `technical.${tooth.jaw}`;
      const tooth_jaw_side = `${i18n.t(jaw_i18n)} / ${side_expand(tooth.side)}`;
      $("#tooth-name").html(tooth.name);
      $("#tooth-jawside").html(title_case(tooth_jaw_side));
      $("#tooth-score-id").val(tooth.id);
      
      const scoring = window.appdb.scoring[tooth.scoring];
      $("#tooth-score").empty().append(`<option value="NA"></option>`);
      $("#tooth-scoring-help").empty();
      
      const groups = [...new Set(scoring.map(item => item.group))];
      
      for (let i = 0; i < groups.length; i++) {
        let items = scoring.filter(item => item.group == groups[i]);
        
        // Filter by set if applicable
        let item_len = items.length;
        while (item_len--) {
          if (items[item_len].hasOwnProperty("set")) {
            if (items[item_len].set !== window.current_tooth.set) {
              items.splice(item_len, 1);
            }
          }
        }
        
        if (items.length > 0) {
          for (let j = 0; j < items.length; j++) {
            const score = find_tooth_score_by_score(tooth.scoring, items[j].score);
            const text = `${score.description}`;
            const img = img_preference == "mfh" ? items[j].image : items[j].xray;
            const img_alt = img_preference == "mfh" ? items[j].xray : items[j].image;
            
            const html = `
              <div class="col-sm-6 col-md-4 col-lg-3 col-xl-2 mb-2">
                <div id="tooth-scoring-help-item-${items[j].score}" class="tooth-scoring-help-item" 
                     data-tooth-id="${tooth.id}" data-tooth-score="${items[j].score}" 
                     data-toggle="tooltip" data-html="true" title="${text}">
                  <h6 class="d-block bg-secondary text-white p-2">${items[j].display} (${items[j].score})</h6>
                  <img class="mx-auto d-block" src="${img}" 
                       data-scoring-id="${items[j].id}" data-tooth-score="${items[j].score}" 
                       data-alt-src="${img_alt}" />
                </div>
              </div>
            `;
            
            $("#tooth-scoring-help").append(html);
          }
        }
      }
      
      // Set current score if exists
      let has_score = false;
      let score = "NA";
      if (window.scores.hasOwnProperty(tooth_key)) {
        if (window.scores[tooth_key] != "NA") {
          has_score = true;
          score = window.scores[tooth_key];
        }
      }
      if (has_score && score != "NA") {
        $("#tooth-score").val(score);
        $(".tooth-scoring-help-item").removeClass("bg-primary");
        $(`#tooth-scoring-help-item-${score}`).addClass("bg-primary");
      }
      $("#tooth-scoring").show();
      
      $("#analysis-card .alert").hide();
      $("#help-card").show();
    }
  }
}

function clear_tooth_selection() {
  $("g.spots path").removeClass('active');
  $("g.spots polygon").removeClass('active');
  $("#tooth-scoring").hide();
  $("#analysis-card .alert").show();
  $("#help-card").hide();
  window.current_tooth = {};
  window.current_tooth_index = -1;
}

function set_scored_teeth() {
  $("polygon").removeClass("scored");
  $("path").removeClass("scored");
  for (const k in window.scores) {
    if (window.scores.hasOwnProperty(k)) {
      if (window.scores[k] != "NA") {
        if (!$(`#${k}`).hasClass("scored")) {
          $(`#${k}`).addClass("scored");
        }
      }
    }
  }
}

function save_tooth_score(key, score, isddl) {
  if (String(key).indexOf("Tooth") < 0)
    key = "Tooth" + key;
    
  if (isddl) {
    $(".tooth-scoring-help-item").removeClass("bg-primary");
    $(`#tooth-scoring-help-item-${score}`).addClass("bg-primary");
  } else {
    $("#tooth-score").val(score);
    
    if ($(`#tooth-scoring-help-item-${score}`).hasClass("bg-primary")) {
      $(`#tooth-scoring-help-item-${score}`).removeClass("bg-primary");
      $("#tooth-score").val("");
      score = "NA";
    } else {
      $(".tooth-scoring-help-item").removeClass("bg-primary");
      $(`#tooth-scoring-help-item-${score}`).addClass("bg-primary");
    }
  }
  
  window.scores[key] = (score == "NA") ? "NA" : Number(score);
  set_scored_teeth();
  
  window.scrollTo(0, 0);
  window.is_dirty = true;
  display_current_file();
  
  const auto_page = storage.getSettings().auto_page_teeth;
  if (auto_page) {
    goto_next_tooth();
  }
}

function show_tooth_chart(obj, id, jaw) {
  $(".btn-tooth-chart").removeClass("active");
  $(`.btn-tooth-chart[data-chart='${id}']`).removeClass("btn-secondary").addClass("active");
  $(".tooth-chart").hide();
  $(`#tc-${id}-maxillary`).show();
  $(`#tc-${id}-mandibular`).show();
  
  update_chart_numbering(storage.getSettings().numbering);
  set_scored_teeth();
}

// Analysis functions
async function run_analysis() {
  $("#results-case-number").html($("#case_number_input").val());
  $("#results-observation-date").html($("#observation_date_input").val());
  $("#results-analyst").html($("#analyst_input").val());
  
  const scores = prep_scores_for_analysis();
  
  $("#results-score-table tbody").empty();
  
  // Prepare input for API
  const input_data = {
    scores: scores,
    case_info: {
      case_number: $("#case_number_input").val() || 'CASE',
      observation_date: $("#observation_date_input").val(),
      analyst: $("#analyst_input").val()
    },
    language: i18n.language
  };

  console.log(input_data);
  
  try {
    $("#spinner p").html(i18n.t('alerts.running-analysis'));
    $("#spinner").show();
    
    // TODO: Replace with actual API endpoint
    const API_ENDPOINT = '/api/analyze';
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input_data)
    });
    
    if (!response.ok) {
      throw new Error('Analysis failed');
    }
    
    const results = await response.json();
    console.log(results);
    
    localStorage.removeItem("results");
    localStorage.setItem("results", JSON.stringify(results));
    parse_output(results);
    
    $("#results-images").empty();
    if (results.images) {
      show_output_image(results.images.distribution, $("#results-images"), "Distribution");
      show_output_image(results.images.formation, $("#results-images"), "Formation");
    }
    
    $("#spinner").hide();
  } catch (error) {
    console.error('Analysis error:', error);
    $("#spinner").hide();
    $("#tab-review-info").tab('show');
    Snackbar.show({
      text: error.message || 'Analysis failed',
      pos: 'bottom-center',
      showAction: false
    });
  }
}

function parse_output(data) {
  let inputs = data.inputs[0];
  Object.keys(inputs).forEach(key => {
    if (inputs.hasOwnProperty(key)) {
      if (key != 'Obs' && key != 'Neander') {
        const row = $("<tr></tr>");
        const cell_code = $("<td></td>").html(`${key}`);
        const cell_value = $("<td></td>").html(`${inputs[key]}`);
        row.append(cell_code).append(cell_value);
        $("#results-score-table tbody").append(row);
      }
    }
  });
  
  const json = data.outputs;

  console.log(json);
  
  const mu = json.mean_corrected_age === "NA" ? "NA" : json.mean_corrected_age.toFixed(3);
  const w = json.within_variance === "NA" ? "NA" : json.within_variance.toFixed(3);
  const b = json.between_variance === "NA" ? "NA" : json.between_variance.toFixed(3);
  
  $("#results-mu").val(mu);
  $("#results-w").val(w);
  $("#results-b").val(b);
  $("#results-prediction").html(`${json.known_age === null ? "NA" : json.known_age.toFixed(3)} ${i18n.t('results.year')}(s)`);
  $("#results-lower").html(json.known_age_lower_95.toFixed(3));
  $("#results-upper").html(json.known_age_upper_95.toFixed(3));
  
  $("#results-prediction-table tbody").empty();
  $("#results-prediction-table tbody").append(add_prediction_row(90, mu, w, b));
  $("#results-prediction-table tbody").append(add_prediction_row(95, mu, w, b));
  $("#results-prediction-table tbody").append(add_prediction_row(99, mu, w, b));
}

function show_output_image(base64Data, parent, title) {
  if (base64Data && typeof base64Data == "string") {
    const img = $("<img></img>");
    img.attr("src", `data:image/png;base64,${base64Data}`)
       .addClass("img-fluid")
       .attr("alt", title)
       .attr("title", title);
    parent.append(img);
  }
}

// Helper functions
function prep_scores_for_analysis() {
  const output = {
    "dc": "NA",
    "dm1": "NA",
    "dm2": "NA",
    "UI1": "NA",
    "UI2": "NA",
    "LI1": "NA",
    "LI2": "NA",
    "C": "NA",
    "P3": "NA",
    "P4": "NA",
    "M1": "NA",
    "M2": "NA",
    "M3": "NA"
  };
  
  // Loop through scores and get highest value for each
  for (const k in window.scores) {
    if (window.scores.hasOwnProperty(k)) {
      const tooth_idx = find_tooth_index(k.replace("Tooth", ""));
      if (tooth_idx > -1) {
        const tooth = window.appdb.teeth[tooth_idx];
        const current = output[tooth.field] == "NA" ? 0 : Number(output[tooth.field]);
        if (window.scores[k] != "NA") {
          if (Number(window.scores[k]) > Number(current)) {
            output[tooth.field] = window.scores[k];
          }
        }
      }
    }
  }
  
  return output;
}

function populate_review() {
  const numbering = storage.getSettings().numbering === 'universal' ? 'id' : storage.getSettings().numbering;
  
  $("#scores-table tbody").empty();
  
  const review_scores = [];
  Object.keys(window.scores).forEach(key => {
    const id = key.replace("Tooth", "");
    if (window.scores.hasOwnProperty(key)) {
      if (window.scores[key] != "NA") {
        let tooth = window.appdb.teeth.filter(item => item.id == id);
        if (tooth && tooth.length > 0) tooth = tooth[0];
        
        const score = lookup_score(tooth.scoring, window.scores[key]);
        
        review_scores.push({
          id: tooth.id,
          tooth: tooth,
          score: score,
          display: window.scores[key]
        });
      }
    }
  });
  
  review_scores.sort((a, b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));
  
  for (let i = 0; i < review_scores.length; i++) {
    const i18n_set = `technical.${review_scores[i].tooth.set}`;
    
    const row = $("<tr></tr>");
    const cell_numbering = $("<td></td>").html(`${review_scores[i].tooth[numbering]}`);
    const cell_set = $("<td></td>").html(`${title_case(i18n.t(i18n_set))}`);
    const cell_jaw = $("<td></td>").html(`${swap_jaw_name(review_scores[i].tooth.jaw)}`);
    const cell_side = $("<td></td>").html(`${side_expand(review_scores[i].tooth.side)}`);
    const cell_tooth = $("<td></td>").html(`${review_scores[i].tooth.name}`);
    const cell_score = $("<td></td>").addClass("text-right").html(`${review_scores[i].score.display} (${review_scores[i].display})`);
    const cell_remove = $("<td></td>").html(`<a href="#" class="btn-clear-score text-danger" data-tooth-id="${review_scores[i].tooth.id}">${i18n.t("review.remove")}</a>`);
    
    row.append(cell_numbering)
       .append(cell_set)
       .append(cell_jaw)
       .append(cell_side)
       .append(cell_tooth)
       .append(cell_score)
       .append(cell_remove);
    $("#scores-table tbody").append(row);
  }
  
  prep_scores_for_analysis();
}

// Utility functions
function find_tooth_index(key) {
  for (let i = 0; i < window.appdb.teeth.length; i++) {
    if (window.appdb.teeth[i].id == key) {
      return i;
    }
  }
  return -1;
}

function find_tooth_score_by_score(mode, score) {
  for (let i = 0; i < window.appdb.scoring[mode].length; i++) {
    if (window.appdb.scoring[mode][i].score == score) {
      return window.appdb.scoring[mode][i];
    }
  }
  return -1;
}

function lookup_score(type, value) {
  const score = window.appdb.scoring[type].filter(item => Number(item.score) == Number(value));
  if (score && score.length > 0) return score[0];
  return {};
}

function update_chart_numbering(numbering) {
  for (let i = 0; i < window.appdb.teeth.length; i++) {
    if (numbering.toLowerCase() === "universal")
      $(`.toothLabels text#lbl${window.appdb.teeth[i].id}`).text(window.appdb.teeth[i].id);
    if (numbering.toLowerCase() === "fdi")
      $(`.toothLabels text#lbl${window.appdb.teeth[i].id}`).text(window.appdb.teeth[i].fdi);
    if (numbering.toLowerCase() === "palmer")
      $(`.toothLabels text#lbl${window.appdb.teeth[i].id}`).text(window.appdb.teeth[i].palmer);
    if (numbering.toLowerCase() === "field")
      $(`.toothLabels text#lbl${window.appdb.teeth[i].id}`).text(window.appdb.teeth[i].field);
  }
}

function update_scoring_images(images) {
  if (!is_json_empty(window.current_tooth)) {
    $(".tooth-scoring-help-item img").each(function(idx) {
      const score = find_tooth_score_by_score(window.current_tooth.scoring, $(this).attr("data-tooth-score"));
      $(this).attr("src", images === "mfh" ? score.image : score.xray);
      $(this).data("alt-src", images === "mfh" ? score.xray : score.image);
    });
  }
}

function swap_tooth_score_image(img_obj) {
  const original = $(img_obj).attr('src');
  const alt = $(img_obj).data('alt-src');
  $(img_obj).attr('src', alt).data('alt-src', original);
}

function set_tooth_paging() {
  $("#prev-tooth-button").removeClass("disabled").data("index", window.current_tooth_index - 1);
  $("#next-tooth-button").removeClass("disabled").data("index", window.current_tooth_index + 1);
  
  if (window.current_tooth_index == 0) {
    $("#prev-tooth-button").addClass("disabled");
  }
  if (window.current_tooth_index == window.appdb.teeth.length - 1) {
    $("#next-tooth-button").addClass("disabled");
  }
}

function goto_next_tooth() {
  if (window.current_tooth.set) {
    if (window.current_tooth.set === "permanent") {
      if (window.current_tooth.id + 1 < 33) {
        const tooth = find_tooth(window.current_tooth.id + 1);
        show_tooth_chart(null, tooth.set, tooth.jaw);
        select_tooth(tooth.id);
      } else {
        show_tooth_chart(null, "permanent", "maxillary");
        select_tooth(1);
      }
    } else {
      const max_char = "T".charCodeAt(0);
      let next_char = window.current_tooth.id.charCodeAt(0) + 1;
      if (window.current_tooth.id == 'C')
        next_char = 'H'.charCodeAt(0);
      if (window.current_tooth.id == 'M')
        next_char = 'R'.charCodeAt(0);
        
      if (next_char < max_char + 1) {
        const tooth = find_tooth(String.fromCharCode(next_char));
        show_tooth_chart(null, tooth.set, tooth.jaw);
        select_tooth(tooth.id);
      } else {
        show_tooth_chart(null, "deciduous", "maxillary");
        select_tooth("A");
      }
    }
  }
}

function goto_prev_tooth() {
  if (window.current_tooth.set) {
    if (window.current_tooth.set === "permanent") {
      if (window.current_tooth.id - 1 > 0) {
        const tooth = find_tooth(window.current_tooth.id - 1);
        show_tooth_chart(null, tooth.set, tooth.jaw);
        select_tooth(tooth.id);
      } else {
        show_tooth_chart(null, "permanent", "maxillary");
        select_tooth(32);
      }
    } else {
      const min_char = "A".charCodeAt(0);
      const max_char = "T".charCodeAt(0);
      
      let prev_char = window.current_tooth.id.charCodeAt(0) - 1;
      if (prev_char >= min_char && prev_char <= max_char) {
        if (window.current_tooth.id == 'H')
          prev_char = 'C'.charCodeAt(0);
        if (window.current_tooth.id == 'R')
          prev_char = 'M'.charCodeAt(0);
          
        const tooth = find_tooth(String.fromCharCode(prev_char));
        show_tooth_chart(null, tooth.set, tooth.jaw);
        select_tooth(tooth.id);
      } else {
        show_tooth_chart(null, "deciduous", "maxillary");
        select_tooth("T");
      }
    }
  }
}

function find_tooth(key) {
  for (let i = 0; i < window.appdb.teeth.length; i++) {
    if (window.appdb.teeth[i].id == key) {
      return window.appdb.teeth[i];
    }
  }
  return {};
}

function reset_score(id) {
  if (window.scores.hasOwnProperty(`Tooth${id}`)) {
    window.scores[`Tooth${id}`] = "NA";
  }
  populate_review();
  set_scored_teeth();
}

function add_prediction_row(perc, mu, w, b) {
  const ci = calc_ci(perc, mu, w, b);
  const row = $("<tr></tr>");
  const cell_code = $("<td></td>").html(`${perc == 0 ? i18n.t('results.default') : perc}`);
  const cell_value = $("<td></td>").html(`${ci[0]}`);
  const cell_value2 = $("<td></td>").html(`${ci[1]}`);
  row.append(cell_code).append(cell_value).append(cell_value2);
  return row;
}

function calc_ci(perc, mu, w, b) {
  let mult = 0;
  switch (Number(perc)) {
    case 90:
      mult = 1.645;
      break;
    case 95:
      mult = 1.960;
      break;
    case 99:
      mult = 2.576;
      break;
    default:
      mult = 2;
      break;
  }

  if (mu === null || mu === "NA") mu = 0;
  if (w === null || w === "NA") w = 0;
  if (b === null || b === "NA") b = 0;
  
  const lower = (Math.exp((Number(mu) - (mult * Math.pow((Number(w) + Number(b)), 0.5)))) - 0.75).toFixed(3);
  const upper = (Math.exp((Number(mu) + (mult * Math.pow((Number(w) + Number(b)), 0.5)))) - 0.75).toFixed(3);
  
  return [lower, upper];
}

function validate_case_info() {
  if ($("#case_number_input").val().trim().length == 0) {
    Snackbar.show({
      text: i18n.t('alerts.case-info-missing-case-number'),
      pos: 'bottom-center',
      showAction: false,
    });
    return false;
  }
  return true;
}

// Helper text functions
function title_case(text) {
  const words = text.toLowerCase().split(" ");
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i][0].toUpperCase() + words[i].slice(1);
  }
  return words.join(" ");
}

function swap_jaw_name(j) {
  if (j.toLowerCase() === "maxillary")
    return i18n.t('technical.maxillary');
  if (j.toLowerCase() == "mandibular")
    return i18n.t('technical.mandibular');
  return j;
}

function side_expand(s) {
  if (s.toLowerCase() === "r")
    return i18n.t('technical.right');
  if (s.toLowerCase() === "l")
    return i18n.t('technical.left');
}

function is_json_empty(j) {
  return Object.keys(j).length === 0 && j.constructor === Object;
}

// Event handlers
$(document).ready(function() {
  // Initialize tooltips
  $('[data-toggle="tooltip"]').tooltip();
  
  // Button event handlers
  $(".btn-new-case").on('click', function(e) {
    e.preventDefault();
    new_case();
  });
  
  $(".btn-load-case").on('click', function(e) {
    e.preventDefault();
    open_case();
  });
  
  $(".btn-save-case").on('click', function(e) {
    e.preventDefault();
    save_case();
  });
  
  $(".btn-tooth-chart").on('click', function(e) {
    e.preventDefault();
    show_tooth_chart($(this), $(this).data('chart'), $(this).data('jaw'));
  });
  
  $(".case-button").on('click', function(e) {
    $("#tab-case-info").tab('show');
  });
  
  $(".scoring-button").on('click', function(e) {
    e.preventDefault();
    if (validate_case_info()) {
      $("#tab-scoring-info").tab('show');
    }
  });
  
  $(".review-button").on('click', function(e) {
    $("#tab-review-info").tab('show');
  });
  
  $(".analyze-button").on('click', function(e) {
    e.preventDefault();
    if (validate_case_info()) {
      $("#tab-results-info").tab('show');
      run_analysis();
    }
  });
  
  $(".reset-button").on('click', function(e) {
    $("#confirmation-header").html(i18n.t('confirmation.reset.header'));
    $("#confirmation-body").html(`<p>${i18n.t('confirmation.reset.body')}</p>`);
    $("#confirmation-btn-no").html(i18n.t('confirmation.btn-no'));
    $("#confirmation-btn-yes")
      .html(i18n.t('confirmation.btn-yes'))
      .off('click')
      .on('click', function() {
        $("#tab-case-info").tab('show');
        reset_scores();
        $("#confirmation-modal").modal('hide');
      });
    $("#confirmation-modal").modal('show');
  });
  
  $(".reset-all-button").on('click', function(e) {
    $("#confirmation-header").html(i18n.t('confirmation.reset-all.header'));
    $("#confirmation-body").html(`<p>${i18n.t('confirmation.reset-all.body')}</p>`);
    $("#confirmation-btn-no").html(i18n.t('confirmation.btn-no'));
    $("#confirmation-btn-yes")
      .html(i18n.t('confirmation.btn-yes'))
      .off('click')
      .on('click', function() {
        $("#tab-case-info").tab('show');
        new_case();
        $("#confirmation-modal").modal('hide');
      });
    $("#confirmation-modal").modal('show');
  });
  
  $(".export-pdf-button").on('click', function(e) {
    e.preventDefault();
    const today = new Date();
    const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    const dateTime = date + ' ' + time;
    
    $("#results-export-on").html(dateTime);
    exportToPDF();
  });
  
  $("body").on('click', '.btn-clear-score', function(e) {
    e.preventDefault();
    reset_score($(this).data("tooth-id"));
  });
  
  $("#btn-save-settings").on('click', function(e) {
    e.preventDefault();
    save_settings();
  });

  // Settings modal event handler - load current settings when modal opens
  $("#settings-modal").on('show.bs.modal', function() {
    open_settings();
  });

  // Tab change handler
  $('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
    isScoringTabActive = false;
    
    switch (e.target.id) {
      case "tab-scoring-info":
        isScoringTabActive = true;
        break;
      case "tab-review-info":
        populate_review();
        break;
    }
  });
  
  // Tooth selection handlers
  $("body").on('click', 'text[data-disabled="false"]', function(e) {
    e.preventDefault();
    select_tooth($(this).data('key'));
  });
  
  $("body").on('click', '.spots polygon[data-disabled="false"]', function(e) {
    e.preventDefault();
    select_tooth($(this).data('key'));
  });
  
  $("body").on('click', '.spots path[data-disabled="false"]', function(e) {
    e.preventDefault();
    select_tooth($(this).data('key'));
  });
  
  // Scoring handlers
  $("body").on('click', '.tooth-scoring-help-item', function(e) {
    e.preventDefault();
    $(this).tooltip('hide');
    save_tooth_score($(this).data("tooth-id"), $(this).data("tooth-score"), false);
  });
  
  $("body").on('mouseenter', '.tooth-scoring-help-item', function(e) {
    e.preventDefault();
    $(this).tooltip('show');
    swap_tooth_score_image($(this).find('img'));
  });
  
  $("body").on('mouseleave', '.tooth-scoring-help-item', function(e) {
    e.preventDefault();
    swap_tooth_score_image($(this).find('img'));
  });
  
  $("#tooth-score").on('change', function(e) {
    e.preventDefault();
    save_tooth_score($("#tooth-score-id").val(), $("#tooth-score").val(), true);
  });
  
  $("#prediction-perc").on('change', function(e) {
    e.preventDefault();
    
    const results = JSON.parse(localStorage.getItem("results"));
    
    const ci = [
      results.outputs[`known_age_lower_${$("#prediction-perc").val()}`].toFixed(3),
      results.outputs[`known_age_upper_${$("#prediction-perc").val()}`].toFixed(3)
    ];
    
    $("#results-lower").html(ci[0]);
    $("#results-upper").html(ci[1]);
    
    // TODO: Update images based on confidence level
  });
  
  $("#tab-pane-case-info input, #tab-pane-case-info textarea").on('change', function(e) {
    e.preventDefault();
    window.is_dirty = true;
    display_current_file();
  });
  
  // Keyboard navigation
  $("body").on('keydown', function(e) {
    if (isScoringTabActive) {
      if (e.which == 37 || e.which == 39) {
        e.preventDefault();
        if (e.which == 37)
          goto_prev_tooth();
        else
          goto_next_tooth();
      }
    }
  });
  
  // Initialize the app
  init();
});

// Export functions for module usage
export { init, new_case, open_case, save_case, run_analysis };