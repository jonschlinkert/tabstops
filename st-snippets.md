### Navigation

* [index](../genindex.html "General Index")
* [next](completions.html "Completions") |
* [previous](macros.html "Macros") |
* [Sublime Text Help](../index.html) >>
* [Extending Sublime Text](extensibility.html) >>

This guide is deprecated. New content at [docs.sublimetext.info](http://docs.sublimetext.info)

# Snippets [¶](#snippets "Permalink to this headline")

Whether you are coding or writing the next vampire best-seller, you're likely to need certain short fragments of text again and again. Use snippets to save yourself tedious typing. Snippets are smart templates that will insert text for you and adapt it to their context.

To create a new snippet, select **Tools | New Snippet...**. Sublime Text will present you with an skeleton for a new snippet.

Snippets can be stored under any package's folder, but to keep it simple while you're learning, you can save them to your folder.

## Snippets File Format [¶](#snippets-file-format "Permalink to this headline")

Snippets typically live in a Sublime Text package. They are simplified XML files with the extension . For instance, you could have a inside an package.

The structure of a typical snippet is as follows (including the default hints Sublime Text inserts for your convenience):
<pre><span>&lt;snippet&gt;</span>
    <span>&lt;content&gt;</span><span>&lt;![CDATA[Type your snippet here]]&gt;</span><span>&lt;/content&gt;</span>
    <span>&lt;!-- Optional: Tab trigger to activate the snippet --&gt;</span>
    <span>&lt;tabTrigger&gt;</span>xyzzy<span>&lt;/tabTrigger&gt;</span>
    <span>&lt;!-- Optional: Scope the tab trigger will be active in --&gt;</span>
    <span>&lt;scope&gt;</span>source.python<span>&lt;/scope&gt;</span>
    <span>&lt;!-- Optional: Description to show in the menu --&gt;</span>
    <span>&lt;description&gt;</span>My Fancy Snippet<span>&lt;/description&gt;</span>
<span>&lt;/snippet&gt;</span>
</pre>

The element contains all the information Sublime Text needs in order to know _what_ to insert, _whether_ to insert it and _when_. Let's see all of these parts in turn.

<dl>
  <dt></dt>
  <dd>

The actual snippet. Snippets can range from simple to fairly complex templates. We'll look at examples of both later.

Keep the following in mind when writing your own snippets:

>
    * If you want the get a literal, you have to escape it like this:.
    * When writing a snippet that contains indentation, always use tabs. The tabs will be transformed into spaces when the snippet is inserted if the option is set to.The must be included in a section. Snippets won't work if you don't do this!
</dd>

<dt></dt>
<dd>

Defines the sequence of keys you will press to insert this snippet. The snippet will kick in as soon as you hit the key after typing this sequence.

A tab trigger is an implicit key binding.
</dd>

<dt></dt>
<dd>Scope selector determining the context where the snippet will be active.
See [_Scopes_](syntaxdefs.html#scopes-and-scope-selectors) for more information.</dd>

<dt></dt>
<dd>Used when showing the snippet in the Snippets menu. If not present, Sublime Text
defaults to the name of the snippet.</dd>
</dl>

With this information, you can start writing your own snippets as described in the next sections.

Note

In the interest of brevity, we're only including the element's text in examples unless otherwise noted.

## Snippet Features [¶](#snippet-features "Permalink to this headline")

### Environment Variables [¶](#environment-variables "Permalink to this headline")

Snippets have access to contextual information in the form of environment variables. Sublime Text sets the values of the variables listed below automatically.

You can also add your own variables to provide extra information. These custom variables are defined in files.

| **$PARAM1, $PARAM2...** | Arguments passed to the command. (Not covered here.) |
| **$SELECTION** | The text that was selected when the snippet was triggered. |
| **$TM_CURRENT_LINE** | Content of the line the cursor was in when the snippet was triggered. |
| **$TM_CURRENT_WORD** | Current word under the cursor when the snippet was triggered. |
| **$TM_FILENAME** | File name of the file being edited including extension. |
| **$TM_FILEPATH** | File path to the file being edited. |
| **$TM_FULLNAME** | User's user name. |
| **$TM_LINE_INDEX** | Column the snippet is being inserted at, 0 based. |
| **$TM_LINE_NUMBER** | Row the snippet is being inserted at, 1 based. |
| **$TM_SELECTED_TEXT** | An alias for **$SELECTION**. |
| **$TM_SOFT_TABS** | if is true, otherwise. |
| **$TM_TAB_SIZE** | Spaces per-tab (controlled by the option). |

Let's see a simple example of a snippet using variables:

```
====================================
USER NAME:          $TM_FULLNAME
FILE NAME:          $TM_FILENAME
 TAB SIZE:          $TM_TAB_SIZE
SOFT TABS:          $TM_SOFT_TABS
====================================

# Output:
====================================
USER NAME:          guillermo
FILE NAME:          test.txt
 TAB SIZE:          4
SOFT TABS:          YES
====================================
```

### Fields [¶](#fields "Permalink to this headline")

With the help of field markers, you can cycle through positions within the snippet by pressing the key. Fields are used to walk you through the customization of a snippet once it's been inserted.

```
First Name: $1
Second Name: $2
Address: $3
```

In the example above, the cursor will jump to if you press once. If you press a second time, it will advance to , etc. You can also move backwards in the series with . If you press after the highest tab stop, Sublime Text will place the cursor at the end of the snippet's content so that you can resume normal editing.

If you want to control where the exit point should be, use the mark.

You can break out of the field cycle any time by pressing .

### Mirrored Fields [¶](#mirrored-fields "Permalink to this headline")

Identical field markers mirror each other: when you edit the first one, the rest will be populated with the same value in real time.

```
First Name: $1
Second Name: $2
Address: $3
User name: $1
```

In this example, "User name" will be filled out with the same value as "First Name".

### Place Holders [¶](#place-holders "Permalink to this headline")

By expanding the field syntax a little bit, you can define default values for a field. Place holders are useful when there's a general case for your snippet but you still want to keep its customization convenient.

```perl
First Name: ${1:Guillermo}
Second Name: ${2:López}
Address: ${3:Main Street 1234}
User name: $1
```

Variables can be used as place holders:

```perl
First Name: ${1:Guillermo}
Second Name: ${2:López}
Address: ${3:Main Street 1234}
User name: ${4:$TM_FULLNAME}
```

And you can nest place holders within other place holders too:

```
Test: ${1:Nested ${2:Placeholder}}
```

### Substitutions [¶](#substitutions "Permalink to this headline")

Warning

This section is a draft and may contain inaccurate information.

In addition to the place holder syntax, tab stops can specify more complex operations with substitutions. Use substitutions to dynamically generate text based on a mirrored tab stop.

The substitution syntax has the following syntaxes:

>

*

<dl>
  <dt> **var_name**</dt>
  <dd>The variable name: 1, 2, 3...</dd>

  <dt> **regex**</dt>
  <dd>Perl-style regular expression: See the [Boost library reference for regular expressions](http://www.boost.org/doc/libs/1_44_0/libs/regex/doc/html/boost_regex/syntax/perl_syntax.html) .</dd>

  <dt> **format_string**</dt>
  <dd>See the [Boost library reference for format strings](http://www.boost.org/doc/libs/1_44_0/libs/regex/doc/html/boost_regex/format/perl_format.html) .</dd>

  <dt> **options**</dt>
  <dd>
    <dl>
      <dt>Optional. May be any of the following:</dt>
      <dd>
        <dl>
          <dt> **i**</dt>
          <dd>Case-insensitive regex.</dd>

          <dt> **g**</dt>
          <dd>Replace all occurrences of.</dd>

          <dt> **m**</dt>
          <dd>Don't ignore newlines in the string.</dd>
        </dl>
      </dd>
    </dl>
  </dd>
</dl>

With substitutions you can, for instance, underline text effortlessly:

```
Original: ${1:Hey, Joe!}
Transformation: ${1/./=/g}

# Output:

      Original: Hey, Joe!
Transformation: =========
```

### Navigation

* [index](../genindex.html "General Index")
* [next](completions.html "Completions") |
* [previous](macros.html "Macros") |
* [Sublime Text Help](../index.html) >>
* [Extending Sublime Text](extensibility.html) >>
