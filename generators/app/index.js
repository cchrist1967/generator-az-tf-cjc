var Generator = require('yeoman-generator');
const { exec } = require('child_process');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('babel');
  }

  async prompting() {
    this.answers = await this.prompt([
      {
        type: "input",
        name: "stack",
        message: "Your project stack.  Must be a string with no spaces.",
        default: this.appname // Default to current folder name
      },
      {
        type: "input",
        name: "overview",
        message: "Please provide a description of this project stack.",
        store: true
      },
      {
        type: "input",
        name: "name",
        message: "Your first and last name",
        store: true
      },
      {
        type: "input",
        name: "nanager",
        message: "Your Manager's name",
        store: true
      },
      {
        type: "input",
        name: "narket",
        message: "Your market",
        store: true
      },
      {
        type: "input",
        name: "project",
        message: "The name of this project",
        store: true
      },
      {
        type: "input",
        name: "owner",
        message: "Who owns the resources created by this stack?",
        store: true
      },
      {
        type: "input",
        name: "client",
        message: "Name of client/customer",
        store: true
      },
      {
        type: "confirm",
        name: "precommit",
        message: "Would you like to install the pre-commit checks?"
      },
      {
        type: "confirm",
        name: "gitflow",
        message: "Would you like to use git flow as a branching strategy?"
      },
      {
        type: 'list',
        name: 'region',
        message: 'Select default Azure Region:',
        choices: [
          {
            name: 'Central US',
            value: 'Central US',
          }, {
            name: 'East US',
            value: 'East US'

          }, {
            name: 'East US 2',
            value: 'East US 2'
          }, {
            name: 'North Central US',
            value: 'North Central US'
          }, {
            name: 'South Central US',
            value: 'South Central US'
          }, {
            name: 'West Central US',
            value: 'West Central US'
          }, {
            name: 'WEST US',
            value: 'WEST US'
          }, {
            name: 'WEST US 2',
            value: 'WEST US 2'
          }
        ],
        store: true
      },
      {
        type: 'checkbox',
        name: 'environments',
        message: 'Select all environments you want to support:',
        choices: [
          {
            name: 'dev',
            value: 'dev',
            checked: true
          }, {
            name: 'qa',
            value: 'qa'

          }, {
            name: 'sit',
            value: 'sit'
          }, {
            name: 'uat',
            value: 'uat'
          }, {
            name: 'prod',
            value: 'prod',
            checked: true
          }
    
        ],
        store: true
      }
      
    ]);

  }


  writing() {

    // TERRAFORM TEMPLATES
    this.fs.copy(
      this.templatePath('main.tf'),
      this.destinationPath('main.tf')
    );

    this.fs.copy(
      this.templatePath('outputs.tf'),
      this.destinationPath('outputs.tf')
    );

    this.fs.copyTpl(
      this.templatePath('variables.tf'),
      this.destinationPath('variables.tf'),
      {
        name:    this.answers.name,
        manager: this.answers.manager,
        market:  this.answers.market,
        project: this.answers.project,
        owner:   this.answers.owner,
        client:  this.answers.client
      }
    );

    // ATLANTIS PROJECT & WORKFLOW CONFIGURATION
    this.fs.copy(
      this.templatePath('atlantis.yaml'),
      this.destinationPath('atlantis.yaml')
    );

    this.fs.copy(
      this.templatePath('scripts'),
      this.destinationPath('scripts')
    );


    // REPO CONFIG
    this.fs.copy(
      this.templatePath('.gitignore.tpl'),
      this.destinationPath('.gitignore')
    );

    this.fs.copyTpl(
      this.templatePath('README.md'),
      this.destinationPath('README.md'),
      { overview: this.answers.overview }
    );

    if (this.answers.precommit) {
      this.fs.copy(
        this.templatePath('.pre-commit-config.yaml'),
        this.destinationPath('.pre-commit-config.yaml')
      )
    }

    for (var env of this.answers.environments) {
      // TERRAFORM PARAMETERS
      this.fs.copyTpl(
        this.templatePath('parameters/env.tfvars'),
        this.destinationPath('parameters/<%= env %>.tfvars'),
        { 
          env: env,
          region: this.answers.region
        }
      );
      this.fs.copyTpl(
        this.templatePath('parameters/env-stack.tfvars'),
        this.destinationPath('parameters/<%= env %>-<%= stack %>.tfvars'),
        { 
          env: env,
          stack: this.answers.stack
        }
      );

      this.fs.copyTpl(
        this.templatePath('backends/env-stack-backend-key'),
        this.destinationPath('backends/<%= env %>-<%= stack %>-backend-key'),
        { 
          env: env,
          stack: this.answers.stack
        }
      );

      // TERRAFORM BACKENDS
      if (['dev', 'qa', 'sit'].includes(env)) {
        this.fs.copyTpl(
          this.templatePath('backends/lower-backend'),
          this.destinationPath('backends/<%= env %>-backend'),
          { env: env }
        )
      };
      if (['uat', 'prod'].includes(env)) {
        this.fs.copyTpl(
          this.templatePath('backends/upper-backend'),
          this.destinationPath('backends/<%= env %>-backend'),
          { env: env }
        )
      }

    }
  }

  install() {
    if (this.answers.gitflow) {
      this.log("\n\n*** INSTALLING GIT FLOW & INITIALIZING GIT REPO ***")
      this.spawnCommandSync("sudo", ["apt-get", "install", "git-flow"])
      this.spawnCommandSync("git", ["flow", "init"])
    } else {
      this.log("\n\n*** INITIALIZING GIT REPO ***")
      this.spawnCommandSync("git", ["init"])      
    }
    this.spawnCommandSync("git", ["add", "."])   
    if (this.answers.precommit) {
      this.log("\n\n*** INSTALLING PRE-COMMIT TOOLS ***")
      this.spawnCommandSync("pip3", ["install", "pre-commit"])
      this.spawnCommandSync("pip3", ["install", "checkov"])
      this.spawnCommandSync("pre-commit", ["run", "-a"])
    }
  }

};

