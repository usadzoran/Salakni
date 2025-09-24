import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://zdmseexyaqqrbbqupdxb.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbXNlZXh5YXFxcmJicXVwZHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1ODcxOTE3NCwiZXhwIjoyMDc0Mjk1MTc0fQ.lY13oD1DDmPxfY63UaWBh2R3_UsdMxTExesBBalVqFE";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

let currentUser = null;

// زر التسجيل
document.getElementById("registerBtn").addEventListener("click", async () => {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const role = document.getElementById("role").value;

  const { data, error } = await supabase
    .from("users")
    .insert([{ name, phone, role }])
    .select();

  if (error) {
    alert("خطأ: " + error.message);
    return;
  }

  currentUser = data[0];
  document.getElementById("auth").style.display = "none";

  if (role === "customer") {
    document.getElementById("customer").style.display = "block";
  } else {
    document.getElementById("driver").style.display = "block";
    loadRides();
  }
});

// زر إرسال طلب
document.getElementById("rideBtn").addEventListener("click", async () => {
  const destination = document.getElementById("destination").value;

  const { data, error } = await supabase
    .from("rides")
    .insert([{ customer_id: currentUser.id, destination, status: "pending" }])
    .select();

  if (error) {
    alert("خطأ: " + error.message);
    return;
  }

  alert("✅ تم إرسال الطلب!");
});

// تحميل الطلبات للسائق
async function loadRides() {
  const { data, error } = await supabase
    .from("rides")
    .select("id, destination, status")
    .eq("status", "pending");

  if (error) {
    console.error(error);
    return;
  }

  const ridesList = document.getElementById("ridesList");
  ridesList.innerHTML = "";

  data.forEach((ride) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <b>وجهة:</b> ${ride.destination}<br>
      <button onclick="acceptRide('${ride.id}')">قبول</button>
    `;
    ridesList.appendChild(div);
  });
}

// قبول طلب
window.acceptRide = async function (ride_id) {
  const { data, error } = await supabase
    .from("rides")
    .update({ status: "accepted", driver_id: currentUser.id })
    .eq("id", ride_id)
    .eq("status", "pending")
    .select();

  if (error) {
    alert("خطأ: " + error.message);
    return;
  }

  alert("🚖 تم قبول الطلب!");
  loadRides();
};
