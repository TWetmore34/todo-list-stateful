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
    const todoCompleteEl = document.querySelector(".list-complete");
    const updateTodoList = (todos) => {
        let templateCompleted = "";
        let templateIncomplete = "";
        todos.forEach((todo) => {
            const todoTemplate = `<li>
            <${!todo.editable ? "span" : `input value="${todo.title}" type='text'`} id="${todo.id}" ${todo.completed ? 'class="completed"' : ""}>
            ${!todo.editable ? todo.title : ""}</${!todo.editable ? "span" : "input"}>
            <div class="btn-container">
            <svg data-state=${!todos.editable ? "Edit" : "Submit"} fill="#fff" class="btn--edit" id=${todo.id} focusable="false" aria-hidden="true" viewBox="0 0 24 24" aria-label="fontSize small"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
            <svg class="btn--delete" fill="#fff" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="DeleteIcon" aria-label="fontSize small"><path id=${todo.id} class="btn--delete" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
            </div>
            `;
            
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
            if(event.target.classList.value === "btn--delete"){
                Model.removeTodo(id).then(res=>{
                    state.todos = state.todos.filter(todo=> +todo.id !== +id)
                }).catch(err=>alert(`delete todo failed: ${err}`))
            }
                 // handles completed strikethroughs
                    let completeClass = event.target.classList.value.split(" ").includes("completed")
                    if(event.target.tagName === "SPAN") {
                        let updated = {
                            title: event.target.innerHTML,
                            completed: !completeClass,
                            editable: false,
                            id
                        }
                        Model.updateTodo(updated, id)
                        .then(res => {
                            state.todos = state.todos.map(todo => {
                                if(todo.id == id) {
                                    todo = updated
                                }
                                return todo
                            })
                        }).catch(err => {
                            console.log(err)
                        })
                    }
                    // handles edit to db
                    console.log(event.target)
                    if(event.target.getAttribute("data-state") === "Submit") {
                        console.log(event.target)
                        let updated = {
                            title: event.target.parentElement.children.item(0).value,
                            editable: false,
                            completed: completeClass,
                            id
                        }
        
                        Model.updateTodo(updated, id).then(res => {
                            console.log("sent request")
                            state.todos = state.todos.map(todo => {
                                if(todo.id == id) {
                                    todo = updated
                                }
                                return todo
                            })
                        }).catch(err => {
                            console.log(err)
                        })
                    }
                    // handles change from span to input tag
                    if(event.target.getAttribute("data-state") === "Edit"){
                        state.todos = state.todos.map(todo => {
                            if(todo.id == id) {
                                todo.editable = !todo.editable;
                            }
                            return todo
                        })
                    }
        })
    };

    const bootstrap = () => {
        let count = 0;
        addTodo();
        removeTodo();
        // updateTodo();
        getTodos();
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