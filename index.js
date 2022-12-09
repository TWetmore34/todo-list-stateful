const APIs = (() => {
    const URL = "http://localhost:3000/todos";

    const addTodo = (newTodo) => {
        // post
        return fetch(URL, {
            method: "POST",
            body: JSON.stringify(newTodo),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json());
    };

    const removeTodo = (id) => {
        return fetch(URL + `/${id}`, {
            method: "DELETE",
        }).then((res) => res.json());
    };

    const updateTodo = (newTodo, id) => {
        return fetch(URL + `/${id}`, {
            method: "PUT",
            headers: {"content-type": "application/json"},
            body: JSON.stringify(newTodo)
        })
    }

    const getTodos = () => {
        return fetch(URL).then((res) => res.json());
    };
    return {
        addTodo,
        removeTodo,
        getTodos,
        updateTodo
    };
})();

const Model = (() => {
    //todolist
    class State {
        #todos; //[{id: ,title:, completed: },{}]
        #onChange;
        constructor() {
            this.#todos = [];
        }

        get todos() {
            return this.#todos;
        }

        set todos(newTodo) {
            this.#todos = newTodo;
            this.#onChange?.();
        }

        subscribe(callback) {
            this.#onChange = callback;
        }
    }
    let { getTodos, removeTodo, addTodo, updateTodo } = APIs;

    return {
        State,
        getTodos,
        updateTodo,
        removeTodo,
        addTodo,
    };
})();
//BEM, block element modifier methodology
const View = (() => {
    const formEl = document.querySelector(".form"); //querying
    const todoListEl = document.querySelector(".todo-list");
    const todoCompleteEl = document.querySelector(".list-complete")
    const updateTodoList = (todos) => {
        let templateCompleted = "";
        let templateIncomplete = "";
        todos.forEach((todo) => {
            const todoTemplate = `<li>
            <${!todo.editable ? "span" : `input value="${todo.title}" type='text'`} id="${todo.id}" ${todo.completed ? 'class="completed"' : ""}>
            ${!todo.editable ? todo.title : ""}</${!todo.editable ? "span" : "input"}><button id=${todo.id} class="btn--edit">${!todo.editable ? "Edit" : "Submit"}</button><button class="btn--delete" id="${todo.id}">remove</button></li>`;
            
            if(todo.completed) {
                templateCompleted += todoTemplate;
            } else {
                templateIncomplete += todoTemplate
            }
        });
        if(todos.length === 0){
            template = "no task to display"
        }

        todoListEl.innerHTML = templateIncomplete;
        todoCompleteEl.innerHTML = templateCompleted
    };

    return {
        formEl,
        todoListEl,
        todoCompleteEl,
        updateTodoList,
    };
})();

const ViewModel = ((View, Model) => {
    const state = new Model.State();

    const getTodos = () => {
        Model.getTodos().then((res) => {
            state.todos = res;
        });
    };

    const addTodo = () => {
        View.formEl.addEventListener("submit", (event) => {
            event.preventDefault();
            
            const title = event.target[0].value;
            if(title.trim() === "") {
                alert("please input title!");
                return;
            }
            
            const newTodo = { title, completed: false, editable: false };
            Model.addTodo(newTodo)
                .then((res) => {
                    state.todos = [res, ...state.todos];
                    event.target[0].value = ""
                })
                .catch((err) => {
                    alert(`add new task failed: ${err}`);
                });
        });
    };

    const removeTodo = () => {
        let fullList = document.querySelector(".todo-list-full")
        fullList.addEventListener("click",(event)=>{
            const id = event.target.id;

            // handles deletion
            if(event.target.className === "btn--delete"){
                Model.removeTodo(id).then(res=>{
                    state.todos = state.todos.filter(todo=> +todo.id !== +id)
                }).catch(err=>alert(`delete todo failed: ${err}`))
            }
        })
    };

    const updateTodo = () => {
         // handles completed change
        let fullList = document.querySelector(".todo-list-full")
        fullList.addEventListener("click", (event) => {
            let id = event.target.getAttribute("id")
            let completeClass = event.target.classList.value.split(" ").includes("completed")
            if(event.target.tagName === "SPAN") {
                let updated = {
                    title: event.target.innerHTML,
                    completed: !completeClass,
                    editable: false
                }
                Model.updateTodo(updated, id)
                .then(res => event.target.classList.remove("completed"))
                .catch(err => {
                    console.log(err)
                })
            }
            // handles edit to db
            if(event.target.innerHTML === "Submit") {
                let updated = {
                    title: event.target.parentElement.children.item(0).value,
                    editable: false,
                    completed: completeClass
                }
                console.log(updated)
                Model.updateTodo(updated, id).then(res => {
                    let newState = state.todos.map(todo => {
                        if(todo.id === id) {
                            todo = updated
                        }
                    })
                    state = newState;
                }).catch(err => {
                    console.log(err)
                })
            }
            // handles change to input
            if(event.target.innerHTML === "Edit" || event.target.innerHTML === "Submit"){
                let newTodos = state.todos.map(todo => {
                    if(todo.id == id) {
                        todo.editable = !todo.editable;
                    }
                    return todo
                })
                state.todos = newTodos
            }
        })
    }

    const bootstrap = () => {
        addTodo();
        getTodos();
        removeTodo();
        updateTodo();
        state.subscribe(() => {
            View.updateTodoList(state.todos);
        });
    };

    return {
        bootstrap,
        state
    };
})(View, Model);

ViewModel.bootstrap();
console.log(ViewModel.state)