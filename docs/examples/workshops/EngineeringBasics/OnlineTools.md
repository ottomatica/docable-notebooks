[Setup](Setup.md#setup) | [Shells](Shells.md#shells) |  [Git](Git.md#git) | [Markdown and IDEs](MarkdownEditors.md#markdown) |  [Virtual Environments](Environments.md#environments) | [Task Management](OnlineTools.md#online-tools)

# Task Management

In software engineering work there is often many intangible sets of things *todo* that have to be captured, assigned, prioritized, and tracked. Stickies are not going to cut it!

## Github Issues

Issue trackers, such as Bugzilla, originated as a bug reporting tools. A project hosted on github comes with an issue tracker too. Any one can report an issue, add labels, and assign any team member(s) can be assigned to an issue.

![image](https://cloud.githubusercontent.com/assets/742934/15636814/9b3b210e-25d8-11e6-9180-3d5eba933357.png)

Nowadays, developers also use issues as a lightweight task management tool. For this usecase, it best works for smaller projects.

See *open* issues: https://github.com/alt-code/AutoSpark/issues  
See *closed* issues: https://github.com/alt-code/AutoSpark/issues?q=is%3Aissue+is%3Aclosed

**Features**:

* You can create task lists: https://github.com/blog/1375%0A-task-lists-in-gfm-issues-pulls-comments
* You can use labels to filter issues.
* You can add pictures, code snippets as comments.
* You can assign multiple people as an owner of issue.
* You can reply to a comment on an issue via email. Great way to discuss with others even on phone.

## Trello

[Trello](https://trello.com/) is a planning tool that is inspired from kanban and agile methods.

In kanban, you have a “visual” pipeline for transitioning ideas into a delivered product. In trello, you can move a card (often representing a task) between lists.

### Boards, Lists, Cards

![image](https://cloud.githubusercontent.com/assets/742934/15636941/eb418154-25db-11e6-9814-5a3c835c0c11.png)

Trello allows you to create boards.  On those boards, you can create lists.  Lists can be used to hold cards.

Recommended Pipeline:

* High-level goals: What do you want to accomplish?
* This Week: What actions can you do to accomplish those goals.
* Doing: What are you doing *today*
* Waiting: What is blocked.
* Done: What have you completed.

![image](https://cloud.githubusercontent.com/assets/742934/15635646/cbe2b4fa-25b2-11e6-8dc9-e6cafca6629c.png)

It is recommended that you break tasks down into 2--4 hour chunks. 

### Signs of a bad Trello board

* Empty
* Only high-level goals
* Too many things
* Items sticking around not making progress.

Instead of saying "Do analysis" => "Find R package for doing peak detection". This is more concrete and actionable.

## Scrum

Scrum is a process for managing tasks. The most popular aspect people use is the daily stand-up meeting. In a daily standup, people report the progress and status of the tasks. The idea is by standing up, you won't try taking too long to talk.

The main things covered in a scrum:

* What I did.
* What I need to do next.
* What is blocking me.

## Practice: Set up a Task List and Trello Board

In your Project0 repo.

1. **Create a new issue** related to your progress on this workshop. To create the issue, you can borrow the checklist from the README.md and modify it to work for you. If you've checked off everything, then you should have mastered a great set of foundational skills preparing your for real software engineering work!

2. **Create a personal Trello board** for this semester. What tasks should you be working on? Alternatively, you can play with a similiar tool: [GitHub project boards](https://help.github.com/articles/about-project-boards/).

