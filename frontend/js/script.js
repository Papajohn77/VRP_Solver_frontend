const hostname = window.location.hostname;
const domain = hostname.split(".").slice(-2).join(".");
const backendURL = `https://vrp-solver-api.${domain}`;

const state = {
  models: [],
  vehicles: [],
  depot: null,
  customers: [],
};

async function loadModels() {
  let retries = 3;

  while (retries) {
    try {
      const response = await fetch(`${backendURL}/models`);

      if (!response.ok) {
        const responseError = await response.json();
        const errorMessage = responseError.detail;
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      state.models = responseData.models;
      break;
    } catch (error) {
      if (--retries === 0) {
        Swal.fire({
          icon: "error",
          text: error.message,
          confirmButtonText: "Ok",
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

function displayModelOptions(models, modelId) {
  const modelContainer = document.querySelector(".model-container");
  modelContainer.innerHTML = `<option disabled ${modelId ? "" : "selected"}>
                                --Please choose a model--
                              </option>`;
  modelContainer.insertAdjacentHTML(
    "beforeend",
    models.length === 0
      ? ""
      : models
          .map((model) => {
            return `<option value="${model.id}" 
                    ${model.id == modelId ? "selected" : ""}>
                      ${model.name}
                    </option>`;
          })
          .join("")
  );
}

document
  .querySelector(".select-model-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const modelContainer = document.querySelector(".model-container");
    const selectedOption =
      modelContainer.options[modelContainer.selectedIndex].value;

    if (selectedOption === "--Please choose a model--") return;

    const queryParams = new URLSearchParams(window.location.search);
    queryParams.set("model_id", selectedOption);
    history.pushState(null, "", `?${queryParams.toString()}`);

    initialize();
  });

document
  .querySelector(".create-model-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    try {
      const modelNameInput = document.querySelector(".model_name");
      const modelName = modelNameInput.value;
      modelNameInput.value = "";

      if (!modelName)
        throw new Error("Failed to create model! Model name is required.");

      const response = await fetch(`${backendURL}/models`, {
        method: "POST",
        body: JSON.stringify({
          name: modelName,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const responseError = await response.json();
        const errorMessage = responseError.detail;
        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      state.models = [
        ...state.models,
        {
          id: responseData.id,
          name: modelName,
        },
      ];

      const queryParams = new URLSearchParams(window.location.search);
      const modelId = queryParams.get("model_id");
      displayModelOptions(state.models, modelId);
    } catch (error) {
      Swal.fire({
        icon: "error",
        text: error.message,
        confirmButtonText: "Ok",
      });
    }
  });

async function loadVehicles(modelId) {
  try {
    const response = await fetch(`${backendURL}/vehicles?model_id=${modelId}`);

    if (!response.ok) {
      const responseError = await response.json();
      const errorMessage = responseError.detail;
      throw new Error(errorMessage);
    }

    const responseData = await response.json();

    state.vehicles = responseData.vehicles;
  } catch (error) {
    Swal.fire({
      icon: "error",
      text: error.message,
      confirmButtonText: "Ok",
    });
  }
}

function displayVehicles(vehicles) {
  const vehicleContainer = document.querySelector(".vehicle-container");
  vehicleContainer.innerHTML = "";
  vehicleContainer.insertAdjacentHTML(
    "afterbegin",
    vehicles.length === 0
      ? ""
      : vehicles
          .map((vehicle, i) => {
            return `<tr>
                      <td>${i + 1}</td>
                      <td>${vehicle.name}</td>
                      <td>${vehicle.capacity}</td>
                      <td>
                        <button data-id=${vehicle.id} 
                        class="del-vehicle btn btn-dark">
                          <i class="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>`;
          })
          .join("")
  );
}

document
  .querySelector(".vehicle-container")
  .addEventListener("click", function (e) {
    const vehicleToDelete = e.target.closest(".del-vehicle");

    if (!vehicleToDelete) return;

    const vehicleToDeleteID = vehicleToDelete.dataset.id;

    deleteVehicle(vehicleToDeleteID);
  });

async function deleteVehicle(vehicleId) {
  try {
    const response = await fetch(`${backendURL}/vehicles/${vehicleId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const responseError = await response.json();
      const errorMessage = responseError.detail;
      throw new Error(errorMessage);
    }

    state.vehicles = state.vehicles.filter(
      (vehicle) => vehicle.id != vehicleId
    );

    displayVehicles(state.vehicles);
  } catch (error) {
    Swal.fire({
      icon: "error",
      text: error.message,
      confirmButtonText: "Ok",
    });
  }
}

document
  .querySelector(".create-vehicle-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    try {
      const queryParams = new URLSearchParams(window.location.search);
      const modelId = queryParams.get("model_id");

      if (!modelId)
        throw new Error("Failed to create vehicle! No model selected.");

      const vehicleNameInput = document.querySelector(".vehicle_name");
      const vehicleName = vehicleNameInput.value;
      vehicleNameInput.value = "";

      const vehicleCapacityInput = document.querySelector(".vehicle_capacity");
      const vehicleCapacity = vehicleCapacityInput.value;
      vehicleCapacityInput.value = "";

      if (!vehicleName)
        throw new Error("Failed to create vehicle! Name is required.");

      if (!vehicleCapacity)
        throw new Error("Failed to create vehicle! Capacity is required.");

      const response = await fetch(`${backendURL}/vehicles`, {
        method: "POST",
        body: JSON.stringify({
          name: vehicleName,
          capacity: vehicleCapacity,
          model_id: modelId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const responseError = await response.json();
        const errorMessage = responseError.detail;
        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      state.vehicles = [
        ...state.vehicles,
        {
          id: responseData.id,
          name: vehicleName,
          capacity: vehicleCapacity,
          model_id: modelId,
        },
      ];

      displayVehicles(state.vehicles);
    } catch (error) {
      Swal.fire({
        icon: "error",
        text: error.message,
        confirmButtonText: "Ok",
      });
    }
  });

async function loadDepot(modelId) {
  try {
    const response = await fetch(`${backendURL}/depot?model_id=${modelId}`);

    if (!response.ok) {
      const responseError = await response.json();
      const errorMessage = responseError.detail;
      throw new Error(errorMessage);
    }

    const responseData = await response.json();

    state.depot = responseData.depot;
  } catch (error) {
    Swal.fire({
      icon: "error",
      text: error.message,
      confirmButtonText: "Ok",
    });
  }
}

function displayDepot(depot) {
  const depotContainer = document.querySelector(".depot-container");
  depotContainer.innerHTML = "";
  depotContainer.insertAdjacentHTML(
    "afterbegin",
    depot === null
      ? ""
      : `<tr>
           <td>${depot.name}</td>
           <td>${depot.address}</td>
           <td>
            <button data-id=${depot.id} class="del-depot btn btn-dark">
              <i class="fas fa-trash-alt"></i>
            </button>
           </td>
         </tr>`
  );
}

document
  .querySelector(".depot-container")
  .addEventListener("click", function (e) {
    const depotToDelete = e.target.closest(".del-depot");

    if (!depotToDelete) return;

    const depotToDeleteID = depotToDelete.dataset.id;

    deleteDepot(depotToDeleteID);
  });

async function deleteDepot(depotId) {
  try {
    const response = await fetch(`${backendURL}/depot/${depotId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const responseError = await response.json();
      const errorMessage = responseError.detail;
      throw new Error(errorMessage);
    }

    state.depot = null;

    displayDepot(state.depot);
  } catch (error) {
    Swal.fire({
      icon: "error",
      text: error.message,
      confirmButtonText: "Ok",
    });
  }
}

document
  .querySelector(".create-depot-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    try {
      const queryParams = new URLSearchParams(window.location.search);
      const modelId = queryParams.get("model_id");

      if (!modelId)
        throw new Error("Failed to create depot! No model selected.");

      const depotNameInput = document.querySelector(".depot_name");
      const depotName = depotNameInput.value;
      depotNameInput.value = "";

      const latitudeInput = document.querySelector("#lat1");
      const latitude = latitudeInput.value;
      latitudeInput.value = "";

      const longitudeInput = document.querySelector("#lng1");
      const longitude = longitudeInput.value;
      longitudeInput.value = "";

      const addressInput = document.querySelector("#address1");
      const address = addressInput.value;
      addressInput.value = "";

      document.querySelector("#pac-input-1").value = "";

      if (!depotName)
        throw new Error("Failed to create depot! Name is required.");

      if (!latitude || !longitude || !address)
        throw new Error("Failed to create depot! No location selected.");

      const response = await fetch(`${backendURL}/depot`, {
        method: "POST",
        body: JSON.stringify({
          name: depotName,
          latitude: latitude,
          longitude: longitude,
          address: address,
          model_id: modelId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const responseError = await response.json();
        const errorMessage = responseError.detail;
        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      state.depot = {
        id: responseData.id,
        name: depotName,
        latitude: latitude,
        longitude: longitude,
        address: address,
        model_id: modelId,
      };

      displayDepot(state.depot);
    } catch (error) {
      Swal.fire({
        icon: "error",
        text: error.message,
        confirmButtonText: "Ok",
      });
    }
  });

async function loadCustomers(modelId) {
  try {
    const response = await fetch(`${backendURL}/customers?model_id=${modelId}`);

    if (!response.ok) {
      const responseError = await response.json();
      const errorMessage = responseError.detail;
      throw new Error(errorMessage);
    }

    const responseData = await response.json();

    state.customers = responseData.customers;
  } catch (error) {
    Swal.fire({
      icon: "error",
      text: error.message,
      confirmButtonText: "Ok",
    });
  }
}

function displayCustomers(customers) {
  const customerContainer = document.querySelector(".customer-container");
  customerContainer.innerHTML = "";
  customerContainer.insertAdjacentHTML(
    "afterbegin",
    customers.length === 0
      ? ""
      : customers
          .map((customer, i) => {
            return `<tr>
                      <td>${i + 1}</td>
                      <td>${customer.name}</td>
                      <td>${customer.demand}</td>
                      <td>${customer.address}</td>
                      <td>
                        <button data-id=${customer.id} 
                        class="del-cust btn btn-dark">
                          <i class="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>`;
          })
          .join("")
  );
}

document
  .querySelector(".customer-container")
  .addEventListener("click", function (e) {
    const custToDelete = e.target.closest(".del-cust");

    if (!custToDelete) return;

    const custToDeleteID = custToDelete.dataset.id;

    deleteCustomer(custToDeleteID);
  });

async function deleteCustomer(custId) {
  try {
    const response = await fetch(`${backendURL}/customers/${custId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const responseError = await response.json();
      const errorMessage = responseError.detail;
      throw new Error(errorMessage);
    }

    state.customers = state.customers.filter(
      (customer) => customer.id != custId
    );

    displayCustomers(state.customers);
  } catch (error) {
    Swal.fire({
      icon: "error",
      text: error.message,
      confirmButtonText: "Ok",
    });
  }
}

document
  .querySelector(".create-customer-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    try {
      const queryParams = new URLSearchParams(window.location.search);
      const modelId = queryParams.get("model_id");

      if (!modelId)
        throw new Error("Failed to create customer! No model selected.");

      const customerNameInput = document.querySelector(".customer_name");
      const customerName = customerNameInput.value;
      customerNameInput.value = "";

      const customerDemandInput = document.querySelector(".customer_demand");
      const customerDemand = customerDemandInput.value;
      customerDemandInput.value = "";

      const latitudeInput = document.querySelector("#lat2");
      const latitude = latitudeInput.value;
      latitudeInput.value = "";

      const longitudeInput = document.querySelector("#lng2");
      const longitude = longitudeInput.value;
      longitudeInput.value = "";

      const addressInput = document.querySelector("#address2");
      const address = addressInput.value;
      addressInput.value = "";

      document.querySelector("#pac-input-2").value = "";

      if (!customerName)
        throw new Error("Failed to create customer! Name is required.");

      if (!customerDemand)
        throw new Error("Failed to create customer! Capacity is required.");

      if (!latitude || !longitude || !address)
        throw new Error("Failed to create customer! No location selected.");

      const response = await fetch(`${backendURL}/customers`, {
        method: "POST",
        body: JSON.stringify({
          name: customerName,
          demand: customerDemand,
          latitude: latitude,
          longitude: longitude,
          address: address,
          model_id: modelId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const responseError = await response.json();
        const errorMessage = responseError.detail;
        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      state.customers = [
        ...state.customers,
        {
          id: responseData.id,
          name: customerName,
          demand: customerDemand,
          latitude: latitude,
          longitude: longitude,
          address: address,
          model_id: modelId,
        },
      ];

      displayCustomers(state.customers);
    } catch (error) {
      Swal.fire({
        icon: "error",
        text: error.message,
        confirmButtonText: "Ok",
      });
    }
  });

document.querySelector(".solve").addEventListener("click", async function () {
  try {
    const queryParams = new URLSearchParams(window.location.search);
    const modelId = queryParams.get("model_id");

    if (!modelId) throw new Error("No model selected to solve.");

    const solutionComponent = document.querySelector(".solution");
    solutionComponent.innerHTML = "";
    solutionComponent.insertAdjacentHTML(
      "afterbegin",
      `
      <div class="component">
        <div class="component-title mb-3">
          <h2>Solution</h2>
        </div>
        <div class="solution-container d-flex align-items-center">
          <strong>Loading...</strong>
          <div class="spinner-border ms-auto" role="status" aria-hidden="true">
          </div>
        </div>
      </div>
      `
    );

    const response = await fetch(`${backendURL}/solve?model_id=${modelId}`);

    if (!response.ok) {
      solutionComponent.innerHTML = "";

      const responseError = await response.json();
      const errorMessage = responseError.detail;
      throw new Error(errorMessage);
    }

    const responseData = await response.json();

    const solutionContainer = document.querySelector(".solution-container");
    solutionContainer.classList.remove("d-flex", "align-items-center");
    solutionContainer.innerHTML = "";
    solutionContainer.insertAdjacentHTML(
      "afterbegin",
      `
      <div class="total-distance mb-5">
        Total distance: ${responseData.solution.total_distance_meters} meters
      </div>
      <div class="route-container">
        <p>Routes:</p>
      </div>
      `
    );

    const routes = responseData.solution.routes;
    const vehicles = responseData.solution.vehicles;

    let routesHTML = "";
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].length === 2) continue;

      routesHTML += `<pre>Vehicle ${vehicles[i]}:  `;
      for (let j = 0; j < routes[i].length; j++) {
        routesHTML += `${routes[i][j].name} ${
          j == routes[i].length - 1 ? "" : "-> "
        }`;
      }
      routesHTML += "</pre>";
    }

    document
      .querySelector(".route-container")
      .insertAdjacentHTML("beforeend", routesHTML);
  } catch (error) {
    Swal.fire({
      icon: "error",
      text: error.message,
      confirmButtonText: "Ok",
    });
  }
});

async function initialize() {
  const queryParams = new URLSearchParams(window.location.search);
  const modelId = queryParams.get("model_id");

  await loadModels();
  displayModelOptions(state.models, modelId);

  if (!modelId) return;

  await loadVehicles(modelId);
  displayVehicles(state.vehicles);

  await loadDepot(modelId);
  displayDepot(state.depot);

  await loadCustomers(modelId);
  displayCustomers(state.customers);
}

initialize();
