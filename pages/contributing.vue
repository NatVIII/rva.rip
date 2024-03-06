<script setup lang="ts">
import 'assets/style.css';
import { replaceBadgePlaceholders } from '~~/utils/util';
</script>

<template>
    <div class="desc">
        <h1 v-badge> :ripple: Contributing Events to rva.rip</h1>
            <p>Welcome! Contributing events to rva.rip is easy and accessible. By contributing events to rva.rip you help to ensure that the events you or your
            org host are accessible to the wider RVA community outside of Lex and Instagram, you're able to make your events posted on rva.rip look exactly how you want, and
            ensure that events posted are as up-to-date and accurate as possible. This project's maintainers hope you'll join them in trying to help foster a greater and more integrated queer community
            in Richmond, Virginia.</p>
            <p>There are a couple different ways to contribute events to the calendar, but the main way that'll be gone over in this
            guide will be by using Google Calendar. If you have your events hosted via another service or software package online feel free to email this project's
            maintainers at host@rva.rip to discuss integrating those to minimize your work required.</p>
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
                need to send to this project's maintainers either via an <a href="mailto:host@rva.rip">email</a>, a github <a href="https://github.com/NatVIII/rva.rip/compare">pull request</a>, or just text one of this project's maintainers if you know their number ❤</li>
                <ul>
                    <li><img class="cont-img" src="/contributing/GCalStep8.png" alt="Google Calender Guide Image 8"/></li>
                </ul>
            </ul>
        <h2>Formatting Tips</h2>
            <ul>
                <li>When adding events to the calendar, ensure that your events are being added to the correct calendar</li>
                <ul>
                    <span class="cont-good">👍<img class="cont-img-mid" src="/contributing/GCalTip1.png" alt="Google Calender Tip Image 1"/></span>
                </ul>
                <li>When adding events to the calendar, ensure that your events are being assigned a time period, and that it's under 24 hours. Events longer than 24 hours or for an entire day simply will not appear on rva.rip</li>
                <ul>
                    <span class="cont-bad">👎<img class="cont-img-mid" src="/contributing/GCalTip2.png" alt="Google Calender Tip Image 2"/></span> <br />
                    <span class="cont-bad">👎<img class="cont-img-mid" src="/contributing/GCalTip4.png" alt="Google Calender Tip Image 4"/></span> <br />
                    <span class="cont-good">👍<img class="cont-img-mid" src="/contributing/GCalTip3.png" alt="Google Calender Tip Image 3"/></span> 
                </ul>
                <li>When adding events to the calendar, try not to leave the location field blank. Try and fill it with either a location that will appear and be google maps compatible, or feel free to set an arbitrary location.</li>
                <ul>
                    <span class="cont-bad">👎<img class="cont-img-mid" src="/contributing/GCalTip5.png" alt="Google Calender Tip Image 5"/></span> <br />
                    <span class="cont-good">👍<img class="cont-img-mid" src="/contributing/GCalTip6.png" alt="Google Calender Tip Image 6"/></span> <br />
                    <span class="cont-good">👍<img class="cont-img-mid" src="/contributing/GCalTip7.png" alt="Google Calender Tip Image 7"/></span> <br />
                    <span class="cont-good">👍<img class="cont-img-mid" src="/contributing/GCalTip8.png" alt="Google Calender Tip Image 8"/></span> <br />
                </ul>
                <li>When adding events to the calendar, try not to leave the description blank. Even if you don't feel like adding much information, like if for example you're throwing something on real quick, atleast try and link to where you can find more information for the event (website or social media account). For bonus points, feel free to include an image or poster you've made for your event (guide on how to do this is detailed below)</li>
                <ul>
                    <span class="cont-bad">👎<img class="cont-img-mid" src="/contributing/GCalTip10.png" alt="Google Calender Tip Image 10"/></span> <br />
                    <span class="cont-good">👍<img class="cont-img-mid" src="/contributing/GCalTip11.png" alt="Google Calender Tip Image 11"/></span> <br />
                    <span class="cont-good">👍<img class="cont-img-mid" src="/contributing/GCalTip12.png" alt="Google Calender Tip Image 12"/></span> <br />
                </ul>
            </ul>
        <h2>rva.rip Calendar Preferred Guidelines and Reccomendations</h2>
            <ul>
                <li>rva.rip has a "badge" system for events, think of them like a <a class="badge" v-badge style="vertical-align: top;">:twitter:</a> on the entity formerly known as Twitter.
                Badges are placed at the beginning of an event's title to help provide users on rva.rip the ability to find a group's events or a genre of event at a glance. Some examples of badges are
                <a class="badge" v-badge style="vertical-align: top;">:test:</a>, 
                <a class="badge" v-badge style="vertical-align: top;">:ripple:</a>, 
                <a class="badge" v-badge style="vertical-align: top;">:fojrp:</a>, 
                <a class="badge" v-badge style="vertical-align: top;">:dykes_on_bikes:</a>,
                <a class="badge" v-badge style="vertical-align: top;">:coalition_theater:</a>, and 
                <a class="badge" v-badge style="vertical-align: top;">:hackrva:</a>. When you submit an event on your calendar, they'll be added at the beginning of
                the titles of events for your group.</li>
                <ul>
                    <li>It's reccomended to only use a combination of no more than
                    two badges+emotes in combination, so if your group already has a custom badge then please only insert up to one emoji in the title of your events</li>
                    <ul>
                        <li>Valid and Invalid Title Examples:</li>
                        <a v-badge style="font-size: 1.25em; font-family: 'ChicagoFLF';"><span class="cont-good" style="font-size: 1.25em;">👍</span>
                         Hollywood Cemetery Queer Clothes Swap </a> <br />
                        <a v-badge style="font-size: 1.25em; font-family: 'ChicagoFLF';"><span class="cont-good" style="font-size: 1.25em;">👍</span>
                         :ripple: Hollywood Cemetery Queer Clothes Swap </a> <br />
                        <a v-badge style="font-size: 1.25em; font-family: 'ChicagoFLF';"><span class="cont-good" style="font-size: 1.25em;">👍</span>
                         :ripple: 👗 Hollywood Cemetery Queer Clothes Swap </a> <br />
                        <a v-badge style="font-size: 1.25em; font-family: 'ChicagoFLF';"><span class="cont-good" style="font-size: 1.25em;">👍</span>
                         :ripple: 👕 Hollywood Cemetery Queer Clothes Swap </a> <br />
                        <a v-badge style="font-size: 1.25em; font-family: 'ChicagoFLF';"><span class="cont-good" style="font-size: 1.25em;">👍</span>
                         👗 Hollywood Cemetery Queer Clothes Swap </a> <br />
                        <a v-badge style="font-size: 1.25em; font-family: 'ChicagoFLF';"><span class="cont-good" style="font-size: 1.25em;">👍</span>
                         👗👕 Hollywood Cemetery Queer Clothes Swap </a> <br />
                        <a v-badge style="font-size: 1.25em; font-family: 'ChicagoFLF';"><span class="cont-bad" style="font-size: 1.25em;">👎</span>
                         :ripple:👗👕 Hollywood Cemetery Queer Clothes Swap </a> <br />
                        <a v-badge style="font-size: 1.25em; font-family: 'ChicagoFLF';"><span class="cont-bad" style="font-size: 1.25em;">👎</span>
                         :ripple:👖👗👕 Hollywood Cemetery Queer Clothes Swap </a> <br />
                        <a v-badge style="font-size: 1.25em; font-family: 'ChicagoFLF';"><span class="cont-bad" style="font-size: 1.25em;">👎</span>
                         👖👗👕 Hollywood Cemetery Queer Clothes Swap </a> <br />
                    </ul>
                    <li>Badges are by default added automatically to your events, but they can be added manually by you in the titles of your events.
                    If you're curious about what options are available, feel free to reach out to the maintainers of this project.</li>
                </ul>
                <li>rva.rip has a system for showing images in the preview modals when an event is clicked on. The first three direct links to images hosted online
                will be displayed at the head of the event preview modals. This only applies to events hosted on Google Calendar, events grabbed from other sources
                will in the future include their fetched image in the preview modal automaticaly.</li>
                    <ul>
                        <li>Example of this being used on an event's modal:</li>
                        <img class="cont-img-mid" src="/contributing/GCalTip13.png" alt="Google Calender Tip Image 13" style="max-width:50%;"/>
                        <li>The easiest option is to use imgur like in the tutorial below, but if you run your own website you can directly link to images hosted there</li>
                        <li>If you want to implement it yourself, you can follow these steps using imgur</li>
                            <ul>
                            <li>Navigate to <a href="https://imgur.com/">imgur.com</a> and click on "New post", uploading the images when prompted
                            (steps to creating a new post may be different on desktop vs other platforms).</li>
                                <ul><img class="cont-img-mid" src="/contributing/GCalTip14.png" alt="Google Calender Tip Image 14" /></ul>
                            <li>After your image is uploaded, right click and get a direct URL for it by selecting "Copy Image Link". Ensure the link features ".png",
                            ".jpg", or ",jpeg" at the end of it's url. An example of what this url would look like is <a href="https://i.imgur.com/cUfmuQS.png">https://i.imgur.com/cUfmuQS.png</a>.
                            If your URL doesn't include this file type on the end then it won't properly render inside rva.rip</li>
                                <ul><img class="cont-img-mid" src="/contributing/GCalTip15.png" alt="Google Calender Tip Image 15" /></ul>
                            <li>Inside the description for your event, include your image URL as either a link or in plaintext. If all went well your image will successfully render
                            on rva.rip</li>
                                <ul><img class="cont-img-mid" src="/contributing/GCalTip16.png" alt="Google Calender Tip Image 16" /></ul>
                            </ul>
                    </ul>
                <li>If your group has consistent events at the same time every week, it's okay to put those events on the calendar as a repeating event. 
                There's multiple groups which do weekly events but aren't able to update the calendar every week because of the labor
                and relative decentralization of their groups, and that's okay, as long as there's some kind of indication that an event *may* be occuring it's still cool 
                as hell and I appreciate it. </li>
                <li>The standards above, embedding proper location data and time data, as well as a description with enough information to atleast find the event's information
                elsewhere on the internet, will help ensure that you get the engagement out of having your events on rva.rip that you may desire. They're not necessary,
                and you'll probably see other calendars which don't follow these standards whatsoever, but I also really appreciate it when you follow these standards.
                </li>
            </ul>
    </div>
    <Footer />
</template>