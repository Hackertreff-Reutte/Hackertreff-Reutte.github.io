---
layout: post
author: HTR
post-title: "Gemeinderahtswahlen 2022 Listenumfrage"
tags: Politik
---
<link rel="stylesheet" href="{{ layout.post_assets | liquify }}/css/post.css">

# Leistbares Wohnen für junge Erwachsene

<table id="table_2"></table>
<canvas id="leistbaresWohnenChart"> </canvas>
<div id="leistbaresWohnenOptional"> </div>

# Soll die Gemeinde als Vermieter auftreten?

<table id="table_4"></table>
<canvas id="gemeindeVermieter"> </canvas>
<div id="gemeindeVermieterOptional"> </div>

# Wenn Wohnprojekte geplant sind, gibt es zusätzliche Bauträger?

<table id="table_6"></table>

# Wenn Wohnprojekte geplant sind, handelt es sich dann dabei um günstige oder teure Wohnungen?

<table id="table_7"></table>
<canvas id="teureGuensiteWohnungen"> </canvas>
<div id="teureGuensiteWohnungenOptional"> </div>

# Projekte zugunsten Jugendlicher

<table id="table_9"></table>
<canvas id="projekteJugendliche"> </canvas>
<div id="projekteJugendlicheOptional"> </div>

# Soll die Gemeinde Kinderbetreuung organisieren bzw. finanzieren?

<table id="table_11"></table>
<canvas id="gemeindeKinder"> </canvas>
<div id="gemeindeKinderOptional"> </div>

# Wenn Kinderbetreuung von der Gemeinde aus  geplant ist, wer soll darauf Anspruch haben?

<table id="table_13"></table>
<canvas id="kinderAnspruch"> </canvas>

# Wenn Kinderbetreuung von der Gemeinde aus geplant ist,  wie und für welche Altersgruppe soll diese ausgelegt werden? 

<table id="table_14"></table>

# Wenn Kinderbetreuung von der Gemeinde aus geplant ist, für welche Altersgruppen sollte sie während den Ferien verfügbar sein?

<table id="table_15"></table>

# Wenn Kinderbetreuung von der Gemeinde aus  geplant ist, wie werden die Kosten gestaltet?

<table id="table_16"></table>
<canvas id="kinderKosten"> </canvas>
<div id="kinderKostenOptional"> </div>

# Ausbau von öffentlichem Nahverkehr?

<table id="table_18"></table>
<canvas id="ausbauOeffi"> </canvas>
<div id="ausbauOeffiOptional"> </div>

# Anreize  schaffen für "umweltfreundliche Mobilität"?

<table id="table_20"></table>
<canvas id="anreizOeffi"> </canvas>
<div id="anreizOeffiOptional"> </div>

# Höhe der Vereinsförderung für?

<canvas id="vereine"> </canvas>


# Ist Transparenz wichtig?

<table id="table_31"></table>
<canvas id="transparenz"> </canvas>
<div id="transparenzOptional"> </div>

# Werden Protokolle, Beschlüsse und Daten prokativ veröffentlicht?

<table id="table_33"></table>
<canvas id="datenVeroeffentlichen"> </canvas>
<div id="datenVeroeffentlichenOptional"> </div>

# Ausbau Digitalisierung (digitales Gemeindeamt)?

<table id="table_35"></table>
<canvas id="digitalesGemeindeamt"> </canvas>
<div id="digitalesGemeindeamtOptional"> </div>

# Ausbau Internetinfrastruktur (Glasfaser, 5G)?

<table id="table_37"></table>
<canvas id="ausbauInternet5G"> </canvas>



<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.1/chart.min.js" integrity="sha512-QSkVNOCYLtj73J4hbmVoOV6KVZuMluZlioC+trLpewV8qMjsWqlIQvkn1KGX2StWvPMdWGBqim1xlC8krl1EKQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.1/papaparse.min.js" integrity="sha512-EbdJQSugx0nVWrtyK3JdQQ/03mS3Q1UiAhRtErbwl1YL/+e2hZdlIcSURxxh7WXHTzn83sjlh2rysACoJGfb6g==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="{{ layout.post_assets | liquify }}/js/post.js"></script>