# Local Quickstart

1. Install Git and Node
1. Get a Google Calendar API key by asking Natalie or following [this guide](https://developers.google.com/calendar/api/quickstart/js)
1. Open a terminal, clone this repository, and change directory to the repository root:

```
git clone https://github.com/NatVIII/rva.rip.git
cd rva.rip
```

1. Create a `.env` file with the Google Calendar API key

```
echo GOOGLE_CALENDAR_API_KEY="REPLACE_THIS_STRING_WITH_YOUR_GOOGLE_CALENDAR_API_KEY" >> .env
```

1. Install the dependencies to the local node_modules folder

```
npm install
```

1. Run the application

```
npm run dev
```

After it initializes, you should be able to open the application in your browser at http://localhost:3000/

If you want to clear the cache, run the following command (I've noticed this is necessary after adding a new calendar locally)

```
npm run clear-cache
```