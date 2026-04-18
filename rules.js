function getLocationData(engine, key) {
    return engine.storyData.Locations[key];
}

function getSceneClass(engine, key) {
    let locationData = getLocationData(engine, key);

    if (locationData.SceneType === "LoongLocation") {
        return LoongLocation;
    }

    return Location;
}

class GameWorldItem {
    constructor(name, data) {
        this.name = name;
        this.type = data.Type;
        this.initialLocation = data.InitialLocation;
        this.message = data.Message || "";
        this.requiresLantern = data.RequiresLantern || false;
    }
}

function getAllItems(engine) {
    let items = [];
    let itemData = engine.storyData.Items || {};

    for (let [name, data] of Object.entries(itemData)) {
        items.push(new GameWorldItem(name, data));
    }

    return items;
}

function hasItem(engine, itemName) {
    return engine.inventory.items.includes(itemName);
}

function addItem(engine, itemName) {
    if (!hasItem(engine, itemName)) {
        engine.inventory.items.push(itemName);
    }
}

function hasRequiredItems(engine, requiredItems) {
    if (!requiredItems || requiredItems.length === 0) {
        return true;
    }

    return requiredItems.every(item => hasItem(engine, item));
}

class Start extends Scene {
    create() {
        this.engine.setTitle(this.engine.storyData.Title);
        this.engine.show("A dream of watermelon, lakes, and a white loong.");
        this.engine.addChoice("Begin the story");
    }

    handleChoice() {
        this.engine.inventory = {
            items: []
        };

        this.engine.gotoScene(
            getSceneClass(this.engine, this.engine.storyData.InitialLocation),
            this.engine.storyData.InitialLocation
        );
    }
}

class Location extends Scene {
    create(key) {
        this.key = key;
        this.locationData = getLocationData(this.engine, key);

        this.engine.setTitle(key);
        this.showBody();
        this.collectItemsHere();
        this.showInventory();
        this.showChoices();
    }

    showBody() {
        if (this.locationData.Dark && !hasItem(this.engine, "sky lantern")) {
            this.engine.show(this.locationData.DarkBody || "It is too dark to see.");
        } else {
            this.engine.show(this.locationData.Body);
        }
    }

    collectItemsHere() {
        let allItems = getAllItems(this.engine);

        for (let item of allItems) {
            if (item.initialLocation !== this.key) {
                continue;
            }

            if (hasItem(this.engine, item.name)) {
                continue;
            }

            if (item.requiresLantern && !hasItem(this.engine, "sky lantern")) {
                continue;
            }

            addItem(this.engine, item.name);

            if (item.message) {
                this.engine.show(item.message);
            }
        }
    }

    showInventory() {
        let dreamLocations = [
            "On the White Loong",
            "Mountain Lake",
            "Waterfall Lake",
            "Plain Lake",
            "Reed Lake"
        ];

        if (!dreamLocations.includes(this.key)) {
            return;
        }

        let seedItems = this.engine.inventory.items.filter(item => item.includes("seed"));
        if (seedItems.length > 0) {
            this.engine.show("<em>Items collected: " + seedItems.join(", ") + "</em>");
        }

        if (hasItem(this.engine, "sky lantern")) {
            this.engine.show("<em>A sky lantern is drifting beside you.</em>");
        }
    }

    showChoices() {
        let availableChoices = this.getAvailableChoices();

        if (availableChoices.length > 0) {
            for (let choice of availableChoices) {
                this.engine.addChoice(choice.Text, choice);
            }
        } else {
            this.engine.addChoice("The end.");
        }
    }

    getAvailableChoices() {
        let allChoices = this.locationData.Choices || [];
        let availableChoices = [];

        for (let choice of allChoices) {
            if (hasRequiredItems(this.engine, choice.RequiresItems)) {
                availableChoices.push(choice);
            }
        }

        return availableChoices;
    }

    handleChoice(choice) {
        if (choice) {
            this.engine.show("> " + choice.Text);

            this.engine.gotoScene(
                getSceneClass(this.engine, choice.Target),
                choice.Target
            );
        } else {
            this.engine.gotoScene(End);
        }
    }
}

class LoongLocation extends Location {
    create(key) {
        super.create(key);

        if (!hasRequiredItems(this.engine, ["large seed", "thin seed", "round seed", "tiny seed"])) {
            this.engine.show("The loong keeps circling. It feels like something is still missing from the lakes below.");
        } else {
            this.engine.show("The loong seems to know you have found every kind of seed.");
        }
    }
}

class End extends Scene {
    create() {
        this.engine.show("<hr>");
        this.engine.show(this.engine.storyData.Credits);
    }
}

Engine.load(Start, 'myStory.json');