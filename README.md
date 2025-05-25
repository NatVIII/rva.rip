# rva.rip

## Mission Statement

> “Always bear in mind that the people are not fighting for ideas, for the things in anyone’s head. They are fighting to win material benefits, to live better and in peace, to see their lives go forward, to guarantee the future of their children.”

**[― Amilcar Cabral](https://www.marxists.org/subject/africa/cabral/1965/tnlcnev.htm)**
<sub>Guinea-Bissauan and Cape Verdean agricultural engineer, poet, and Pan-African Revolutionary</sub>

This project's purpose is to assist in building a better and more vibrant community with the people of Richmond; with the hope that one day it can help build to greater change :)

![a sticker for rva.rip. It's text is as follows: Richmond's Queer Events Calendar; https://rva.rip; free food, punks, biking, sapphics and gays, LAN parties, palestine protests, soccer games, parties, more!!!!!; with a drawing of the mascot Ripple set to the left staring at the text with a look of paranoia](./doc/sticker.png)

## On Timeliness

Hello folks! It's been so wonderful seeing this project grow and develop over time. I apologize that I have not been the most focused on helping those who submit calendars, features, or create new instances of this site for their local areas as of late. I've been extremely busy with personal efforts as of late, and have experienced some hardship as a result of a layoff at my company. Now that I'm unemployed, I'll try and dedicate more time to truly maintaining and growing this site, and doing my best to serve the wonderful folks who use it again. If you're reading this, thank you for your interest, it's been so heartwarming to see this goofy little project actually be useful for- like- anybody. ❤️

If I haven't gotten to your calendar or your feature or your instance, **it's not because I hate you**, I'm just a girl. I'll be going through my backlog soon, but if you want extra special attention please throw whatever request you have at the top of my email inbox (host@rva.rip).

Mrowmrowmrowmrow

![一个gif的一只狗没有福，写“不辛苦 命苦”](./doc/buxinku.gif)

## How do I add my events to this website?

You have two options!

1. Email me at host@rva.rip with a Google Calendar you'd like to share :)
2. Fork this project and open a pull request with your changes added to ~~/assets/event_sources.json

todo: make this into a page on rva.rip so it's more accessible

## Local Quickstart

If you want to run the entire application locally, visit [QUICKSTART.md](QUICKSTART.md).

## How do I fork this and host it for my city?

`~~/components/App.vue` is the entry point for this website, and in order to get a MVP for you to test yourself you simply have to find where `const endpoints` is defined and comment out all the APIs inside the function. Keep in mind this is simply my workflow, but some more defined steps are below:

- I recommend using one of these text editors with this project: `vscode` or `vscodium` (available on Windows, Linux, Mac)
- Install `npm`
- Fork this project and pull your github remote to initiate a local git repo on your pc
- cd your terminal into the root directory of this project and run the commands `npm install`, `npm audit fix`, and then `npm run dev -- -o` to launch your local dev environment.
- Search for `const endpoints`'s definition in App.vue and comment out all the APIs in order to stop them from loading.
- Copy `sample.env` into a new file named simply `.env` in the root folder and try and fill out as many of the keys as possible, or as is desired for the scope of your project.
- Fill out `~~/assets/event_sources.json` with all of the feeds you'd like to capture
- Begin modifying `const endpoints` again to start uncommenting the APIs you want to target one by one to ensure they work completely
  - In my experience it's completely normal for your event grabbing to work and it not show visually on a local dev preview environment, so if you can get Vercel up and running try and open a development branch and publish your changes there to see if it'll work in a real world environment. There may be better ways to do this but I'm just a lady trying her best with computers.
- When you are finished and satisfied with your code (or want to start getting ready to target production) begin connecting your github repo with Vercel, I'm shocked at how easy it was, leave all the settings at default except to make sure that Vercel knows this repository is targetting the Nuxt framework. Add the environment variables and bing bong so simple you should be done! Behold your labors and maybe add a domain.

## Screenshots

![Screenshot1, a full height screenshot of an early development version of rva.rip](./doc/Screenshot1.png)

![Screenshot2, demonstrating the modal that appears when an event is clicked](./doc/Screenshot2.png)
