# Unit testing

This project uses [Bruno](https://usebruno.com) to run unit tests. Bruno is located at `/Applications/Bruno.app`.

To run a unit test
1. Open Bruno
1. Select the project/collection
1. Click each request and run it
1. Look at the word "Tests" in the results pane to the right
1. If it has a green number, all tests passed. If it has a red number, some tests failed.

To add a new unit test
1. Open the request you want to add a test to
1. In the left panel, click the "Assert" tab
1. Click "Add Assertion"
1. Add Expr, Operator, and Value. No need to commit or click save or anything. It's saved automatically.

Expr can be
- res.status
- res.body
- res.body[0].some_key
- res.body[0].some_key[0].some_key,
- etc.

Operator can be
- Anything from the dropdown
- equals
- isNumber
- gt
- gte
- startsWith
- contains
- endsWith
- isTruthy
- isDefined 
- etc.