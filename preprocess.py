import csv
import json

parentCategory = dict();

with open("data.csv") as csvfile:
    reader = csv.DictReader(csvfile);
    for row in reader:
        if (row["name"] == "US National Debt"):
            continue;
        leaf = dict();
        leaf["name"] = row["name"];
        leaf["size"] = float(row["price"]);
        leaf["category"] = row["category"];
        if (parentCategory.get(row["category"]) == None):
            parentCategory[row["category"]] = [leaf];

        else:
            parentCategory[row["category"]].append(leaf);


categoryJsonList = [];
childrenJsonList = [];

for category in parentCategory:
    # create temp dict for children
    temp_json = {"name":category, "children":parentCategory[category]};
    categoryJsonList.append(temp_json);
    childrenJsonList.extend(parentCategory[category]);


overallJson = {"name":"National Debt","children":categoryJsonList};

with open('debt.json', 'w') as outfile:
    res = json.dump(overallJson, outfile, indent=4, separators=(',', ': '));

overallJson2 = {"name":"National Debt","children":childrenJsonList};

with open('debtNoCategory.json', 'w') as outfile:
    res = json.dump(overallJson2, outfile, indent=4, separators=(',', ': '));





# outside the csv we can now process into json form

        #name,category,price,source1,source2

