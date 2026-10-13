
const form = document.getElementById("pointForm");
const xInput = document.getElementById("x");
const yInput = document.getElementById("y");
const errorElement = document.getElementById("error");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const resultsBody = document.getElementById("resultsBody");

const STORAGE_KEY = "pointCheckResults";

function loadResults() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return [];

        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];

        return parsed.filter(item =>
            item &&
            typeof item.x === "number" &&
            typeof item.y === "number" &&
            typeof item.r === "number" &&
            typeof item.hit === "boolean" &&
            typeof item.time === "string"
        );
    } catch (error) {
        return [];
    }
}

let results = loadResults();

function checkPoint(x, y, r) {
    const inRectangle =
        x >= 0 && x <= r / 2 &&
        y >= 0 && y <= r;

    const inCircle =
        x <= 0 && y <= 0 &&
        x * x + y * y <= (r / 2) * (r / 2);

    const inTriangle =
        x >= 0 && x <= r &&
        y <= 0 && y >= x / 2 - r / 2;

    return inRectangle || inCircle || inTriangle;
}

function drawGraph(r) {
    const width = canvas.width;
    const height = canvas.height;
    const scale = 45;
    const originX = 250;
    const originY = 250;

    const px = x => originX + x * scale;
    const py = y => originY - y * scale;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(45, 145, 235, 0.8)";

    ctx.fillRect(px(0), py(r), r / 2 * scale, r * scale);

    ctx.beginPath();
    ctx.moveTo(px(0), py(0));
    ctx.arc(
        px(0), py(0), r / 2 * scale,
        Math.PI / 2, Math.PI, false
    );
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(px(0), py(0));
    ctx.lineTo(px(r), py(0));
    ctx.lineTo(px(0), py(-r / 2));
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, originY);
    ctx.lineTo(width - 20, originY);
    ctx.moveTo(originX, height - 20);
    ctx.lineTo(originX, 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width - 28, originY - 5);
    ctx.lineTo(width - 20, originY);
    ctx.lineTo(width - 28, originY + 5);

    ctx.moveTo(originX - 5, 28);
    ctx.lineTo(originX, 20);
    ctx.lineTo(originX + 5, 28);
    ctx.stroke();

    ctx.fillStyle = "#222";
    ctx.font = "14px Arial";
    ctx.fillText("X", width - 18, originY - 10);
    ctx.fillText("Y", originX + 10, 20);

    for (let i = -5; i <= 5; i++) {
        if (i === 0) continue;

        ctx.beginPath();
        ctx.moveTo(px(i), originY - 4);
        ctx.lineTo(px(i), originY + 4);
        ctx.moveTo(originX - 4, py(i));
        ctx.lineTo(originX + 4, py(i));
        ctx.stroke();

        ctx.fillText(String(i), px(i) - 4, originY + 17);
        ctx.fillText(String(i), originX + 7, py(i) + 4);
    }

    ctx.fillText("0", originX - 14, originY + 16);
    ctx.fillText("R = " + String(r).replace(".", ","), 15, 20);
    results.forEach(item => {
        if (item.r !== r) return;

        ctx.beginPath();
        ctx.arc(px(item.x), py(item.y), 4, 0, 2 * Math.PI);
        ctx.fillStyle = item.hit ? "#087b32" : "#d32222";
        ctx.fill();
    });
}

function renderResults() {
    resultsBody.replaceChildren();

    results.forEach(item => {
        const row = document.createElement("tr");

        const values = [
            new Intl.DateTimeFormat("ru-RU", {
                dateStyle: "short",
                timeStyle: "medium"
            }).format(new Date(item.time)),
            String(item.x),
            String(item.y),
            String(item.r).replace(".", ","),
            item.hit ? "Попадание" : "Промах"
        ];

        values.forEach((value, index) => {
            const cell = document.createElement("td");
            cell.textContent = value;

            if (index === 4) {
                cell.className = item.hit ? "hit" : "miss";
            }

            row.appendChild(cell);
        });

        resultsBody.appendChild(row);
    });
}

drawGraph(3);
renderResults();

form.addEventListener("submit", function(event) {
    event.preventDefault();
    errorElement.textContent = "";

    const x = Number(xInput.value);
    const yText = yInput.value.trim().replace(",", ".");
    const y = Number(yText);

    const selectedR = Array.from(
        form.querySelectorAll('input[name="r"]:checked')
    ).map(input => Number(input.value));

    if (yText === "" || !Number.isFinite(y) || y < -3 || y > 5) {
        errorElement.textContent =
            "Y должна быть числом от -3 до 5.";
        return;
    }

    if (selectedR.length === 0) {
        errorElement.textContent =
            "Выберите хотя бы одно значение R.";
        return;
    }

    const timestamp = new Date().toISOString();

    selectedR.forEach(r => {
        results.unshift({
            x: x,
            y: y,
            r: r,
            hit: checkPoint(x, y, r),
            time: timestamp
        });
    });

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch (error) {
        errorElement.textContent =
            "Не удалось сохранить историю в браузере.";
        return;
    }

    renderResults();
    drawGraph(Math.max(...selectedR));
});

form.addEventListener("reset", function() {
    errorElement.textContent = "";
});

document.getElementById("clearResults").addEventListener("click", function() {
    results = [];
    localStorage.removeItem(STORAGE_KEY);
    renderResults();
    drawGraph(3);
});
