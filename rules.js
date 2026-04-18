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

function hasRequiredSeeds(engine, requiredSeeds) {
    if (!requiredSeeds || requiredSeeds.length === 0) {
        return true;
    }

    return requiredSeeds.every(seed => engine.inventory.seeds.includes(seed));
}

class Start extends Scene {
    create() {
        this.engine.setTitle(this.engine.storyData.Title);
        this.engine.show("A dream of watermelon, lakes, and a white loong.");
        this.engine.addChoice("Begin the story");
    }

    handleChoice() {
        this.engine.inventory = {
            seeds: []
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
        this.engine.show(this.locationData.Body);

        this.handleSeedCollection();
        this.showInventory();
        this.showChoices();
    }

    handleSeedCollection() {
        let seedType = this.locationData.SeedType;

        if (seedType && !this.engine.inventory.seeds.includes(seedType)) {
            this.engine.inventory.seeds.push(seedType);
            this.engine.show("You collect the " + seedType + " watermelon seed.");
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

    if (
        dreamLocations.includes(this.key) &&
        this.engine.inventory.seeds.length > 0
    ) {
        this.engine.show("<em>Seeds collected: " + this.engine.inventory.seeds.join(", ") + "</em>");
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
            if (hasRequiredSeeds(this.engine, choice.Requires)) {
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

        if (!hasRequiredSeeds(this.engine, ["large", "thin", "round", "tiny"])) {
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