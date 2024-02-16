<script setup lang="ts">
import 'assets/style.css';
import { replaceBadgePlaceholders } from '~~/utils/util';
</script>

<template>
    <div class="desc">
        <h1 v-badge> :ripple: Contributing Events to rva.rip</h1>
            <p>Welcome! Contributing events to rva.rip is easy and accessible. By contributing events to rva.rip you help to ensure that the events you or your
            org host are accessible to the wider RVA community outside of Lex and Instagram, are able to make your events posted on rva.rip look exactly how you want, and
            ensure that events posted are as up-to-date and accurate as possible. I hope you'll join me in trying to help foster a greater and more integrated queer community
            in Richmond, Virginia.</p>
            <p>There are a couple different ways to contribute events to the calendar, but the main way we'll be going over in this
            guide will be by using Google Calendar. If you have your events available in another location available online feel free to email me at host@rva.rip to discuss integrating
            those to minimize your work required.</p>
        <h2>Publishing Google Calendar events</h2>
            <ul>
                <li><a href="https://accounts.google.com">Create a Google Account</a> for your events if one doesn't already exist. The email address associated with the
                google calendar you publish may be visible in some cases, so, ensure it's not an email you use for your personal life.</li>
                <li>Go to to <a href="https://calendar.google.com">calendar.google.com</a> and navigate to the menu on the left side of your screen that says
                "My calendars" and "Other calendars". If you don't already have a calendar that's ready for public display, press the + symbol, and then click "Create new calendar".</li>
                <ul>
                    <li><img class="cont-img" src="/contributing/GCalStep1.png" alt="Google Calender Guide Image 1"/>
                    <img class="cont-img" src="/contributing/GCalStep2.png" alt="Google Calender Guide Image 2"/></li>
                </ul>
                <li>You should then be presented with a screen that looks like the following. Fill out the information and click "Create calendar". After it's created it'll be availabe on the left side of your screen under "My calendars"</li>
                <ul>
                    <li><img class="cont-img" src="/contributing/GCalStep3.png" alt="Google Calender Guide Image 3"/>
                    <img class="cont-img" src="/contributing/GCalStep4.png" alt="Google Calender Guide Image 4"/></li>
                </ul>
                <li>When your calendar is created, access it's "Settings and sharing" menu accessible on desktop by hovering over it with your mouse and clicking the three dots which appear, then "Settings and sharing"</li>
                <ul>
                    <li><img class="cont-img" src="/contributing/GCalStep5.png" alt="Google Calender Guide Image 5"/>
                    <img class="cont-img" src="/contributing/GCalStep6.png" alt="Google Calender Guide Image 6"/></li>
                </ul>
                <li>When you're in your Calendar settings, navigate to "Access permissions for events" and tick the checkbox that says "Make available to public",
                and ensure "See all event details" is selected in the menu to the right of the checkbox.</li>
                <ul>
                    <li><img class="cont-img" src="/contributing/GCalStep7.png" alt="Google Calender Guide Image 7"/></li>
                </ul>
                <li>Now scroll down to the bottom of the page to the "Integrate calendar" section. The Calendar ID ought to be featured here like in the image below, and should end in @group.calendar.google.com
                (in some cases it will be your email, if you feel comfortable with that you can share it but if you don't you'll have to follow the previous steps to create a new calendar). This Calendar ID is what you
                need to send to me either via an <a href="mailto:host@rva.rip">email</a>, a github <a href="https://github.com/NatVIII/rva.rip/compare">pull request</a>, or just text me if you know my number ❤</li>
                <ul>
                    <li><img class="cont-img" src="/contributing/GCalStep8.png" alt="Google Calender Guide Image 8"/></li>
                </ul>
            </ul>
        <h2>Formatting Tips</h2>
            <ul>
                <li>When adding events to the calendar, ensure that your events are being added to the correct calendar</li>
                <ul>
                    <span class="cont-good">🗸</span><img class="cont-img-mid" src="/contributing/GCalTip1.png" alt="Google Calender Tip Image 1"/>  
                </ul>
                <li>When adding events to the calendar, ensure that your events are being assigned a time period, and that it's under 24 hours. Events longer than 24 hours or for an entire day simply will not appear on rva.rip</li>
                <ul>
                    <span class="cont-bad">🞩</span><img class="cont-img-mid" src="/contributing/GCalTip2.png" alt="Google Calender Tip Image 2"/> <br />
                    <span class="cont-bad">🞩</span><img class="cont-img-mid" src="/contributing/GCalTip4.png" alt="Google Calender Tip Image 4"/> <br />
                    <span class="cont-good">🗸</span><img class="cont-img-mid" src="/contributing/GCalTip3.png" alt="Google Calender Tip Image 3"/>  
                </ul>
                <li>When adding events to the calendar, try not to leave the location field blank. Try and fill it with either a location that will appear and be google maps compatible, or feel free to set an arbitrary location.</li>
                <ul>
                    <span class="cont-bad">🞩</span><img class="cont-img-mid" src="/contributing/GCalTip5.png" alt="Google Calender Tip Image 5"/> <br />
                    <span class="cont-good">🗸</span><img class="cont-img-mid" src="/contributing/GCalTip6.png" alt="Google Calender Tip Image 6"/> <br />
                    <span class="cont-good">🗸</span><img class="cont-img-mid" src="/contributing/GCalTip7.png" alt="Google Calender Tip Image 7"/> <br />
                    <span class="cont-good">🗸</span><img class="cont-img-mid" src="/contributing/GCalTip8.png" alt="Google Calender Tip Image 8"/> <br />
                </ul>
                <li>When adding events to the calendar, try not to leave the description blank. Even if you don't feel like adding much information, like if for example you're throwing something on real quick, atleast try and link to where you can find more information for the event (website or social media account). For bonus points, feel free to include an image or poster you've made for your event (guide on how to do this is detailed below)</li>
                <ul>
                    <span class="cont-bad">🞩</span><img class="cont-img-mid" src="/contributing/GCalTip10.png" alt="Google Calender Tip Image 10"/> <br />
                    <span class="cont-good">🗸</span><img class="cont-img-mid" src="/contributing/GCalTip11.png" alt="Google Calender Tip Image 11"/> <br />
                    <span class="cont-good">🗸</span><img class="cont-img-mid" src="/contributing/GCalTip12.png" alt="Google Calender Tip Image 12"/> <br />
                </ul>
                <li>rva.rip has a "badge" system for events, think of them like a <a class="badge" v-badge style="vertical-align: top;">:twitter:</a> on the entity formerly known as Twitter.
                They help you  provide users on rva.rip the ability to find your events at a glance. Some examples of badges are
                <a class="badge" v-badge style="vertical-align: top;">:test:</a>, 
                <a class="badge" v-badge style="vertical-align: top;">:ripple:</a>, 
                <a class="badge" v-badge style="vertical-align: top;">:fojrp:</a>, 
                <a class="badge" v-badge style="vertical-align: top;">:dykes_on_bikes:</a>,
                <a class="badge" v-badge style="vertical-align: top;">:rcbiking:</a>, 
                <a class="badge" v-badge style="vertical-align: top;">:coalition_theater:</a>, and 
                <a class="badge" v-badge style="vertical-align: top;">:hackrva:</a>. When you submit an event on your calendar, </li>
            </ul>
        <h2>rva.rip Calendar Preferred Guidelines and Reccomendations</h2>
    </div>
    <div>
        <div style="background-color: #fb4934;" class="color-stripe"></div>
        <div style="background-color: #fe8019;" class="color-stripe"></div>
        <div style="background-color: #fabd2f;" class="color-stripe"></div>
        <div style="background-color: #b8bb26;" class="color-stripe"></div>
        <div style="background-color: #83a598;" class="color-stripe"></div>
        <div style="background-color: #d3869b;" class="color-stripe"></div>
        <div class="color-stripe"></div><div class="color-stripe"></div>
    </div>
</template>